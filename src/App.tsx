import { useMemo, useState } from 'react';
import ReadingColumn from './components/ReadingColumn';
import { deriveDisplay, promotePeeks, setRowExpansion } from './model/focusedView';

export default function App() {
  // Interim local state — replaced by the full store (undo/redo, URL) in later steps.
  const [pins] = useState<ReadonlySet<string>>(new Set());
  const [overrides, setOverrides] = useState<ReadonlyMap<string, boolean>>(new Map());

  const display = useMemo(() => deriveDisplay(pins, overrides), [pins, overrides]);

  return (
    <div className="app-root">
      <div className="panel-col">
        <div className="panel-sticky">{/* control panel (C4) */}</div>
      </div>
      <ReadingColumn
        display={display}
        onToggle={(n, expand) => setOverrides(setRowExpansion(pins, overrides, n, expand))}
        onPromote={(members) => setOverrides(promotePeeks(pins, overrides, members))}
      />
      <div className="note-rail" aria-hidden="true" />
    </div>
  );
}
