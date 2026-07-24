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

import { useMemo, type ReactNode } from 'react';
import { CURATED_TERMS, curatedTermForMatch } from '../data/terms';
import { parseStatement, type Paragraph, type Segment } from '../lib/math';
import { escapeRegExp, termRegex, variantPattern } from '../model/match';
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
const INDEX_RE_SRC = `(?<![\\p{L}\\p{N}_])(?:${ALL_STEMS.map(variantPattern).join('|')})[a-z]*`;

function canonicalForWord(word: string): string | null {
  return curatedTermForMatch(word)?.canonical ?? null;
}

// Alternation for this statement's ref numbers, longest-first, bounded so a
// ref like "4.31" never matches inside "4.311". Digits/dots only, so it can
// never overlap a curated-term word match.
function refAltSrc(refs: string[]): string {
  if (!refs.length) return '';
  const alt = [...refs].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|');
  return `|(?<![\\d.])(?:${alt})(?!\\d|\\.\\d)`;
}

interface Token {
  text: string;
  canonical: string | null; // curated → clickable mark
  hit: boolean; // matches the active term → highlighted
  ref: string | null; // statement number → clickable cross-ref
}

// Only three statements have refs. Cache the large curated alternation instead
// of compiling it once per prose paragraph.
const tokenRegexCache = new Map<string, RegExp>();

function tokenRegex(refs: string[]): RegExp {
  const key = refs.join(',');
  const cached = tokenRegexCache.get(key);
  if (cached) return cached;
  const regex = new RegExp(`${INDEX_RE_SRC}${refAltSrc(refs)}`, 'giu');
  tokenRegexCache.set(key, regex);
  return regex;
}

interface MatchRange {
  start: number;
  end: number;
}

function overlaps(start: number, end: number, ranges: MatchRange[]): boolean {
  return ranges.some((range) => range.start < end && range.end > start);
}

function tokenize(text: string, activeTerm: string | null, refs: string[]): Token[] {
  const active = activeTerm ? termRegex(activeTerm) : null;
  const activeRanges: MatchRange[] = [];
  if (active) {
    active.lastIndex = 0;
    for (const match of text.matchAll(active)) {
      activeRanges.push({ start: match.index, end: match.index + match[0].length });
    }
  }

  const union = tokenRegex(refs);

  const tokens: Token[] = [];
  const pushPlain = (start: number, end: number) => {
    if (start >= end) return;
    const boundaries = new Set([start, end]);
    for (const range of activeRanges) {
      if (range.start > start && range.start < end) boundaries.add(range.start);
      if (range.end > start && range.end < end) boundaries.add(range.end);
    }
    const sorted = [...boundaries].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      const from = sorted[i - 1];
      const to = sorted[i];
      tokens.push({
        text: text.slice(from, to),
        canonical: null,
        hit: overlaps(from, to, activeRanges),
        ref: null,
      });
    }
  };

  let last = 0;
  union.lastIndex = 0;
  for (const m of text.matchAll(union)) {
    const i = m.index;
    pushPlain(last, i);
    const isRef = refs.includes(m[0]);
    tokens.push({
      text: m[0],
      canonical: isRef ? null : canonicalForWord(m[0]),
      hit: overlaps(i, i + m[0].length, activeRanges),
      ref: isRef ? m[0] : null,
    });
    last = i + m[0].length;
  }
  pushPlain(last, text.length);
  return tokens;
}

interface StyledPiece {
  text: string;
  emph: boolean;
}

function sliceStyled(parts: StyledPiece[], start: number, length: number): StyledPiece[] {
  const pieces: StyledPiece[] = [];
  const end = start + length;
  let offset = 0;
  for (const part of parts) {
    const partEnd = offset + part.text.length;
    const from = Math.max(start, offset);
    const to = Math.min(end, partEnd);
    if (from < to) pieces.push({ text: part.text.slice(from - offset, to - offset), emph: part.emph });
    offset = partEnd;
    if (offset >= end) break;
  }
  return pieces;
}

function renderPieces(pieces: StyledPiece[]): ReactNode[] {
  return pieces.map((piece, i) =>
    piece.emph ? <em key={i}>{piece.text}</em> : <span key={i}>{piece.text}</span>,
  );
}

function renderStyledRun(
  parts: StyledPiece[],
  activeTerm: string | null,
  onSelectTerm: Props['onSelectTerm'],
  refs: string[],
  keyPrefix: string,
  onNavigate?: Props['onNavigate'],
) {
  const text = parts.map((part) => part.text).join('');
  let offset = 0;
  return tokenize(text, activeTerm, refs).map((t, i) => {
    const pieces = sliceStyled(parts, offset, t.text.length);
    offset += t.text.length;
    const key = `${keyPrefix}-${i}`;
    if (t.ref && onNavigate) {
      return <RefLink key={key} target={t.ref} onNavigate={onNavigate} hit={t.hit} />;
    }
    if (t.canonical) {
      return (
        <button
          key={key}
          className={`idx-term ${t.hit ? 'is-hit' : ''}`}
          title={`trace "${t.canonical}"`}
          onClick={(e) => {
            e.stopPropagation();
            onSelectTerm(t.canonical!);
          }}
        >
          {renderPieces(pieces)}
        </button>
      );
    }
    if (t.hit) {
      return (
        <span key={key} className="term-hit">
          {renderPieces(pieces)}
        </span>
      );
    }
    return <span key={key}>{renderPieces(pieces)}</span>;
  });
}

// Which of the statement's refs actually appear inline in its prose (so the
// rest can fall back to the appended "(cf. N)" form). Math segments never count.
function inlineRefs(paragraphs: Paragraph[], refs: string[]): Set<string> {
  if (!refs.length) return new Set();
  const re = new RegExp(
    `(?<![\\d.])(?:${[...refs].sort((a, b) => b.length - a.length).map(escapeRegExp).join('|')})(?!\\d|\\.\\d)`,
    'g',
  );
  const found = new Set<string>();
  for (const p of paragraphs) {
    if (p.kind !== 'prose') continue;
    let run = '';
    const flush = () => {
      re.lastIndex = 0;
      for (const m of run.matchAll(re)) found.add(m[0]);
      run = '';
    };
    for (const seg of p.segments) {
      if (seg.kind === 'math') flush();
      else run += seg.value;
    }
    flush();
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
  const content: ReactNode[] = [];
  let run: StyledPiece[] = [];
  let key = 0;
  const flush = () => {
    if (!run.length) return;
    content.push(...renderStyledRun(run, activeTerm, onSelectTerm, refs, `run-${key++}`, onNavigate));
    run = [];
  };
  for (const seg of segments) {
    if (seg.kind === 'math') {
      flush();
      content.push(<MathSpan key={`math-${key++}`} latex={seg.value} display={seg.display} />);
    } else {
      run.push({ text: seg.value, emph: seg.kind === 'emph' });
    }
  }
  flush();

  return (
    <p className="stmt-para">{content}</p>
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
