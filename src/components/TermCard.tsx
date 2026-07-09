/*
  Selected-term card (spec §9/§9a): appears below the control panel when a
  term is active. "Pin only these" is pin-replacing → the parent confirms
  first; "Add to pins" is additive and immediate.
*/

interface Props {
  term: string;
  occurrences: number;
  statementCount: number;
  narrow: boolean; // panel collapsed → match its 108px width
  onClear: () => void;
  onPinOnly: () => void;
  onAddPins: () => void;
}

export default function TermCard({
  term,
  occurrences,
  statementCount,
  narrow,
  onClear,
  onPinOnly,
  onAddPins,
}: Props) {
  const stat =
    `${occurrences} occurrence${occurrences === 1 ? '' : 's'}` +
    ` · ${statementCount} statement${statementCount === 1 ? '' : 's'}`;
  return (
    <div className={`term-card${narrow ? ' is-narrow' : ''}`}>
      <div className="term-card-head">
        <span className="term-sel-label">Selected:</span>
        <span className="term-chip">{term}</span>
        <button
          type="button"
          className="term-close msym"
          aria-label="Clear selection"
          title="clear selection"
          onClick={onClear}
        >
          close
        </button>
      </div>
      <div className="term-stat">{stat}</div>
      <div className="term-actions">
        <button type="button" className="term-pin-only" onClick={onPinOnly}>
          Pin only these
        </button>
        <button type="button" className="term-add-pins" onClick={onAddPins}>
          Add to pins
        </button>
      </div>
    </div>
  );
}
