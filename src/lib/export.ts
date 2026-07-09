/*
  Study export (spec §8): the pinned statements with their ancestor lineage,
  plus ALL annotations (including on non-pinned statements), in reading order.
  Markdown structure comes from the statements; annotations are plain text.
*/

import { pinAncestorSet, type Pins } from '../model/focusedView';
import { STATEMENTS, ancestorsOf, type Statement } from '../model/tree';

export interface ExportEntry {
  statement: Statement;
  pinned: boolean;
  note?: string;
}

/** Reading-order selection: pins + their lineage, notes + their lineage. */
export function exportSelection(
  pins: Pins,
  notes: Readonly<Record<string, string>>,
): ExportEntry[] {
  const include = new Set<string>();
  for (const n of pins) include.add(n);
  for (const n of pinAncestorSet(pins)) include.add(n);
  for (const n of Object.keys(notes)) {
    include.add(n);
    for (const a of ancestorsOf(n)) include.add(a);
  }
  // Nothing pinned or noted: fall back to the seven roots so the export
  // is never an empty page.
  const selected = include.size
    ? STATEMENTS.filter((s) => include.has(s.n))
    : STATEMENTS.filter((s) => s.parent === null);
  return selected.map((statement) => ({
    statement,
    pinned: pins.has(statement.n),
    note: notes[statement.n],
  }));
}

export function toMarkdown(entries: ExportEntry[], pinCount: number, noteCount: number): string {
  const lines: string[] = [
    '# Tractatus Logico-Philosophicus — study export',
    '',
    'Ludwig Wittgenstein, 1922 (Ogden translation) — via The Foldable Tractatus',
    '',
    `${pinCount} pinned statement${pinCount === 1 ? '' : 's'} · ` +
      `${noteCount} annotation${noteCount === 1 ? '' : 's'}`,
    '',
    '---',
    '',
  ];
  for (const { statement: s, pinned, note } of entries) {
    const indent = '    '.repeat(s.depth);
    lines.push(`${indent}- **${s.n}**${pinned ? ' 📌' : ''} ${s.text}`);
    if (note !== undefined) {
      for (const noteLine of note.split('\n')) {
        lines.push(`${indent}    > ${noteLine}`);
      }
    }
  }
  lines.push('');
  return lines.join('\n');
}

export function downloadMarkdown(markdown: string) {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tractatus-study-export.md';
  a.click();
  URL.revokeObjectURL(url);
}
