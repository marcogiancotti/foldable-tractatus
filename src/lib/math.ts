/*
  Inline-math convention for statement text (spec §2): mathematical notation
  is authored as `$…$` LaTeX in src/data/tractatus.ts. This module only
  splits; rendering is MathText / StatementText, term matching uses stripMath
  so LaTeX source (\bar, \xi, …) never counts as English words.
*/

export interface MathSegment {
  math: boolean;
  value: string; // math: the LaTeX between the $s; text: the literal prose
}

/** Split on $…$ pairs. An unmatched trailing $ stays literal text. */
export function splitMath(text: string): MathSegment[] {
  const segments: MathSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(/\$([^$]+)\$/g)) {
    if (m.index > last) segments.push({ math: false, value: text.slice(last, m.index) });
    segments.push({ math: true, value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ math: false, value: text.slice(last) });
  return segments;
}

/** The prose only — math segments removed. */
export function stripMath(text: string): string {
  return splitMath(text)
    .filter((s) => !s.math)
    .map((s) => s.value)
    .join('');
}
