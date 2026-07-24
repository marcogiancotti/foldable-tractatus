/*
  KaTeX-typeset math. The innerHTML here is the one sanctioned exception to the
  "text is never markup" rule — the input is the curated book data in
  src/data/tractatus.ts (never user input). Standalone so both MathText and the
  figure/table blocks can use it without an import cycle.
*/

import katex from 'katex';

export function MathSpan({ latex, display = false }: { latex: string; display?: boolean }) {
  return (
    <span
      className={display ? 'math math-display' : 'math'}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(latex, { throwOnError: false, displayMode: display }),
      }}
    />
  );
}
