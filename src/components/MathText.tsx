/*
  Statement text with typeset math: prose stays plain text nodes; `$…$`
  segments render through KaTeX. The innerHTML here is the one sanctioned
  exception to the "text is never markup" rule — the input is the curated
  book data in src/data/tractatus.ts, never user input. Used wherever
  statement text appears without the term-mark pipeline (print view,
  cross-reference previews); StatementRow goes through StatementText, which
  applies the same treatment to its math segments.
*/

import katex from 'katex';
import { splitMath } from '../lib/math';

export function MathSpan({ latex }: { latex: string }) {
  return (
    <span
      className="math"
      dangerouslySetInnerHTML={{ __html: katex.renderToString(latex, { throwOnError: false }) }}
    />
  );
}

export default function MathText({ text }: { text: string }) {
  return (
    <>
      {splitMath(text).map((seg, i) =>
        seg.math ? <MathSpan key={i} latex={seg.value} /> : seg.value,
      )}
    </>
  );
}
