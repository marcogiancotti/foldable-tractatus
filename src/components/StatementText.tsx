/*
  Statement text pipeline (spec §9/§9a): curated terms are marked inline and
  clickable; every word matching the active term gets the accent-wash highlight.
  Prose is rendered as text content — never markup — except `$…$`/`$$…$$` math
  (typeset by KaTeX), `\emph{…}` emphasis, and `[[block:ID]]` figure/table
  sentinels (rendered by src/components/blocks). Paragraphs (blank-line
  separated) become block <p>s; term marking applies to plain and emphasized
  prose alike.

  Cross-references (spec §11): the statement numbers Wittgenstein cites in the
  prose (e.g. "No. 5.101") are made clickable *in place* — matched against the
  statement's own `refs` list, never a generic number regex — opening the same
  preview popover as the "(cf. N)" fallback. Any ref not written inline falls
  back to that appended form.
*/

import { useMemo } from 'react';
import { CURATED_TERMS } from '../data/terms';
import { parseStatement, type Paragraph, type Segment } from '../lib/math';
import { escapeRegExp, termRegex } from '../model/match';
import { MathSpan } from './MathSpan';
import { BlockView } from './blocks';
import XRefPreview, { RefLink } from './XRefPreview';

interface Props {
  text: string;
  activeTerm: string | null;
  onSelectTerm: (canonical: string) => void;
  refs?: string[];
  onNavigate?: (n: string) => void;
}

// One regex over all curated stems, longest first so attribution is exact.
const ALL_STEMS = CURATED_TERMS.flatMap((t) => t.variants).sort((a, b) => b.length - a.length);
const INDEX_RE_SRC = `\\b(?:${ALL_STEMS.map(escapeRegExp).join('|')})[a-z]*`;

function canonicalForWord(word: string): string | null {
  const w = word.toLowerCase();
  for (const t of CURATED_TERMS) {
    if (t.variants.some((v) => w.startsWith(v))) return t.canonical;
  }
  return null;
}

// Alternation for this statement's ref numbers, longest-first, bounded so a
// ref like "4.31" never matches inside "4.311". Digits/dots only, so it can
// never overlap a curated-term word match.
function refAltSrc(refs: string[]): string {
  if (!refs.length) return '';
  const alt = [...refs].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
  return `|(?<![\\d.])(?:${alt})(?![\\d.])`;
}

interface Token {
  text: string;
  canonical: string | null; // curated → clickable mark
  hit: boolean; // matches the active term → highlighted
  ref: string | null; // statement number → clickable cross-ref
}

function tokenize(text: string, activeTerm: string | null, refs: string[]): Token[] {
  const active = activeTerm ? termRegex(activeTerm) : null;
  const activeSrc = active ? `|${active.source}` : '';
  const union = new RegExp(`${INDEX_RE_SRC}${activeSrc}${refAltSrc(refs)}`, 'gi');
  const isHit = (w: string) => {
    if (!active) return false;
    const anchored = new RegExp(`^(?:${active.source})$`, 'i');
    return anchored.test(w);
  };

  const tokens: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(union)) {
    const i = m.index;
    if (i > last)
      tokens.push({ text: text.slice(last, i), canonical: null, hit: false, ref: null });
    const isRef = refs.includes(m[0]);
    tokens.push({
      text: m[0],
      canonical: isRef ? null : canonicalForWord(m[0]),
      hit: isRef ? false : isHit(m[0]),
      ref: isRef ? m[0] : null,
    });
    last = i + m[0].length;
  }
  if (last < text.length)
    tokens.push({ text: text.slice(last), canonical: null, hit: false, ref: null });
  return tokens;
}

function renderTokens(
  text: string,
  activeTerm: string | null,
  onSelectTerm: Props['onSelectTerm'],
  refs: string[],
  onNavigate?: Props['onNavigate'],
) {
  return tokenize(text, activeTerm, refs).map((t, i) => {
    if (t.ref && onNavigate) {
      return <RefLink key={i} target={t.ref} onNavigate={onNavigate} />;
    }
    if (t.canonical) {
      return (
        <button
          key={i}
          className={`idx-term ${t.hit ? 'is-hit' : ''}`}
          title={`trace "${t.canonical}"`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTerm(t.canonical!);
          }}
        >
          {t.text}
        </button>
      );
    }
    if (t.hit) {
      return (
        <span key={i} className="term-hit">
          {t.text}
        </span>
      );
    }
    return <span key={i}>{t.text}</span>;
  });
}

// Which of the statement's refs actually appear inline in its prose (so the
// rest can fall back to the appended "(cf. N)" form). Math segments never count.
function inlineRefs(paragraphs: Paragraph[], refs: string[]): Set<string> {
  if (!refs.length) return new Set();
  const re = new RegExp(
    `(?<![\\d.])(?:${[...refs].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})(?![\\d.])`,
    'g',
  );
  const found = new Set<string>();
  for (const p of paragraphs) {
    if (p.kind !== 'prose') continue;
    for (const seg of p.segments) {
      if (seg.kind === 'math') continue;
      for (const m of seg.value.matchAll(re)) found.add(m[0]);
    }
  }
  return found;
}

function Prose({
  segments,
  activeTerm,
  onSelectTerm,
  refs,
  onNavigate,
}: { segments: Segment[]; refs: string[] } & Omit<Props, 'text' | 'refs'>) {
  return (
    <p className="stmt-para">
      {segments.map((seg, si) =>
        seg.kind === 'math' ? (
          <MathSpan key={si} latex={seg.value} display={seg.display} />
        ) : seg.kind === 'emph' ? (
          <em key={si}>{renderTokens(seg.value, activeTerm, onSelectTerm, refs, onNavigate)}</em>
        ) : (
          <span key={si}>{renderTokens(seg.value, activeTerm, onSelectTerm, refs, onNavigate)}</span>
        ),
      )}
    </p>
  );
}

export default function StatementText({
  text,
  activeTerm,
  onSelectTerm,
  refs,
  onNavigate,
}: Props) {
  const paragraphs = useMemo(() => parseStatement(text), [text]);
  const refList = refs ?? [];
  const orphanRefs = useMemo(() => {
    if (!refList.length || !onNavigate) return [];
    const inline = inlineRefs(paragraphs, refList);
    return refList.filter((r) => !inline.has(r));
  }, [paragraphs, refList, onNavigate]);

  return (
    <>
      {paragraphs.map((para, pi) =>
        para.kind === 'block' ? (
          <BlockView key={pi} id={para.id} />
        ) : (
          <Prose
            key={pi}
            segments={para.segments}
            activeTerm={activeTerm}
            onSelectTerm={onSelectTerm}
            refs={refList}
            onNavigate={onNavigate}
          />
        ),
      )}
      {orphanRefs.length > 0 && onNavigate && (
        <XRefPreview refs={orphanRefs} onNavigate={onNavigate} />
      )}
    </>
  );
}
