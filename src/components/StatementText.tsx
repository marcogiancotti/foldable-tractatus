/*
  Statement text pipeline (spec §9/§9a): curated terms are marked inline and
  clickable; every word matching the active term gets the accent-wash highlight.
  Text is always rendered as text content — never markup — except `$…$` math
  segments, which are curated data typeset by KaTeX (see MathText) and are
  excluded from term marking.
*/

import { useMemo } from 'react';
import { CURATED_TERMS } from '../data/terms';
import { splitMath } from '../lib/math';
import { escapeRegExp, termRegex } from '../model/match';
import { MathSpan } from './MathText';

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

export default function StatementText({ text, activeTerm, onSelectTerm }: Props) {
  const segments = useMemo(
    () =>
      splitMath(text).map((seg) => ({
        ...seg,
        tokens: seg.math ? [] : tokenize(seg.value, activeTerm),
      })),
    [text, activeTerm],
  );
  return (
    <>
      {segments.map((seg, si) =>
        seg.math ? (
          <MathSpan key={si} latex={seg.value} />
        ) : (
          seg.tokens.map((t, i) => {
            if (t.canonical) {
              return (
                <button
                  key={`${si}-${i}`}
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
                <span key={`${si}-${i}`} className="term-hit">
                  {t.text}
                </span>
              );
            }
            return t.text;
          })
        ),
      )}
    </>
  );
}
