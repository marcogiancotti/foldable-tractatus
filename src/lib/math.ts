/*
  Rich statement-text model (spec §2). Statement text in src/data/tractatus.ts
  is authored as:
    • paragraphs separated by blank lines;
    • inline math `$…$` and display math `$$…$$` (LaTeX, typeset by KaTeX);
    • emphasis `\emph{…}`;
    • figure/table blocks as `[[block:ID]]` sentinels on their own line,
      rendered by src/components/blocks.
  This module parses that into a small AST consumed by StatementText (term-mark
  pipeline) and MathText (print / cross-ref preview). `stripMath` yields the
  prose words only, so LaTeX source never counts as English words in matching.
*/

export type Segment =
  | { kind: 'text'; value: string }
  | { kind: 'emph'; value: string }
  | { kind: 'math'; value: string; display: boolean };

export type Paragraph =
  | { kind: 'block'; id: string }
  | { kind: 'prose'; segments: Segment[] };

const BLOCK_RE = /^\[\[block:(.+?)\]\]$/;

/** Split a prose paragraph into text / emph / math segments. */
function parseSegments(s: string): Segment[] {
  const out: Segment[] = [];
  let plain = '';
  const flush = () => {
    if (plain) out.push({ kind: 'text', value: plain });
    plain = '';
  };
  let i = 0;
  while (i < s.length) {
    if (s.startsWith('$$', i)) {
      const end = s.indexOf('$$', i + 2);
      if (end >= 0) {
        flush();
        out.push({ kind: 'math', display: true, value: s.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    if (s[i] === '$') {
      const end = s.indexOf('$', i + 1);
      if (end > i + 1) {
        flush();
        out.push({ kind: 'math', display: false, value: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    if (s.startsWith('\\emph{', i)) {
      let depth = 1;
      let j = i + 6;
      for (; j < s.length && depth > 0; j++) {
        if (s[j] === '{') depth++;
        else if (s[j] === '}' && --depth === 0) break;
      }
      flush();
      out.push({ kind: 'emph', value: s.slice(i + 6, j) });
      i = j + 1;
      continue;
    }
    plain += s[i];
    i++;
  }
  flush();
  return out;
}

/** Parse a statement's text into paragraphs (prose or figure/table blocks). */
export function parseStatement(text: string): Paragraph[] {
  return text
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p): Paragraph => {
      const m = p.match(BLOCK_RE);
      return m ? { kind: 'block', id: m[1] } : { kind: 'prose', segments: parseSegments(p) };
    });
}

/** The prose only — math and figure blocks removed, emphasis unwrapped. */
export function stripMath(text: string): string {
  return parseStatement(text)
    .map((p) =>
      p.kind === 'block'
        ? ''
        : p.segments.map((s) => (s.kind === 'math' ? '' : s.value)).join(''),
    )
    .join(' ');
}
