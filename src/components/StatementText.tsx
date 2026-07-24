/*
  Statement text pipeline (spec §9/§9a): curated terms are marked inline and
  clickable; every word matching the active term gets the accent-wash highlight.
  Prose is rendered as text content — never markup — except `$…$`/`$$…$$` math
  (typeset by KaTeX), `\emph{…}` emphasis, and `[[block:ID]]` figure/table
  sentinels (rendered by src/components/blocks). Paragraphs (blank-line
  separated) become block <p>s; term marking applies to plain and emphasized
  prose alike.
*/

import { useMemo } from 'react';
import { CURATED_TERMS } from '../data/terms';
import { parseStatement, type Segment } from '../lib/math';
import { escapeRegExp, termRegex } from '../model/match';
import { MathSpan } from './MathSpan';
import { BlockView } from './blocks';

interface Props {
  text: string;
  activeTerm: string | null;
  onSelectTerm: (canonical: string) => void;
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

interface Token {
  text: string;
  canonical: string | null; // curated → clickable mark
  hit: boolean; // matches the active term → highlighted
}

function tokenize(text: string, activeTerm: string | null): Token[] {
  const active = activeTerm ? termRegex(activeTerm) : null;
  const activeSrc = active ? `|${active.source}` : '';
  const union = new RegExp(`${INDEX_RE_SRC}${activeSrc}`, 'gi');
  const isHit = (w: string) => {
    if (!active) return false;
    const anchored = new RegExp(`^(?:${active.source})$`, 'i');
    return anchored.test(w);
  };

  const tokens: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(union)) {
    const i = m.index;
    if (i > last) tokens.push({ text: text.slice(last, i), canonical: null, hit: false });
    tokens.push({ text: m[0], canonical: canonicalForWord(m[0]), hit: isHit(m[0]) });
    last = i + m[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), canonical: null, hit: false });
  return tokens;
}

function renderTokens(text: string, activeTerm: string | null, onSelectTerm: Props['onSelectTerm']) {
  return tokenize(text, activeTerm).map((t, i) => {
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

function Prose({
  segments,
  activeTerm,
  onSelectTerm,
}: { segments: Segment[] } & Omit<Props, 'text'>) {
  return (
    <p className="stmt-para">
      {segments.map((seg, si) =>
        seg.kind === 'math' ? (
          <MathSpan key={si} latex={seg.value} display={seg.display} />
        ) : seg.kind === 'emph' ? (
          <em key={si}>{renderTokens(seg.value, activeTerm, onSelectTerm)}</em>
        ) : (
          <span key={si}>{renderTokens(seg.value, activeTerm, onSelectTerm)}</span>
        ),
      )}
    </p>
  );
}

export default function StatementText({ text, activeTerm, onSelectTerm }: Props) {
  const paragraphs = useMemo(() => parseStatement(text), [text]);
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
          />
        ),
      )}
    </>
  );
}
