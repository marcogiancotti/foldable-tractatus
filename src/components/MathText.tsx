/*
  Statement text without the term-mark pipeline: paragraphs, math (via KaTeX),
  emphasis, and figure/table blocks. Used where statement text appears plainly —
  print view and cross-reference previews. StatementRow instead goes through
  StatementText, which adds inline term marking over the same structure.
*/

import { parseStatement } from '../lib/math';
import { MathSpan } from './MathSpan';
import { BlockView } from './blocks';

export default function MathText({ text }: { text: string }) {
  return (
    <>
      {parseStatement(text).map((para, pi) =>
        para.kind === 'block' ? (
          <BlockView key={pi} id={para.id} />
        ) : (
          <p key={pi} className="stmt-para">
            {para.segments.map((seg, i) =>
              seg.kind === 'math' ? (
                <MathSpan key={i} latex={seg.value} display={seg.display} />
              ) : seg.kind === 'emph' ? (
                <em key={i}>{seg.value}</em>
              ) : (
                seg.value
              ),
            )}
          </p>
        ),
      )}
    </>
  );
}
