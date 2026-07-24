/*
  The printable study export (spec §8): hidden on screen, becomes the whole
  document under @media print. "Export as PDF" = window.print() → the reader
  saves as PDF from the browser dialog.
*/

import type { ExportEntry } from '../lib/export';
import MathText from './MathText';

interface Props {
  entries: ExportEntry[];
  pinCount: number;
  noteCount: number;
}

export default function PrintView({ entries, pinCount, noteCount }: Props) {
  return (
    <div className="print-view" aria-hidden="true">
      <h1 className="pv-title">Tractatus Logico-Philosophicus</h1>
      <div className="pv-byline">
        Ludwig Wittgenstein, 1922 (Ogden translation) — study export
      </div>
      <div className="pv-meta">
        {pinCount} pinned statement{pinCount === 1 ? '' : 's'} · {noteCount} annotation
        {noteCount === 1 ? '' : 's'}
      </div>
      <hr className="pv-rule" />
      {entries.map(({ statement: s, pinned, note }) => (
        <div key={s.n} className="pv-entry" style={{ marginLeft: s.depth * 24 }}>
          <div className="pv-row">
            <span className="pv-num">{s.n}</span>
            <div className={`pv-text${pinned ? ' is-pinned' : ''}`}>
              <MathText text={s.text} />
            </div>
          </div>
          {note !== undefined && <div className="pv-note">{note}</div>}
        </div>
      ))}
    </div>
  );
}
