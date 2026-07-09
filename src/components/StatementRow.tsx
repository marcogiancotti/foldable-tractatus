import type { RowState } from '../model/focusedView';
import { ownCount, subtreeCount } from '../model/match';
import { statement } from '../model/tree';
import AnnotationNote from './AnnotationNote';
import StatementText from './StatementText';

interface Props {
  n: string;
  depth: number;
  state: RowState;
  pinned: boolean;
  activeTerm: string | null;
  note?: string;
  noteEditing: boolean;
  marginMode: boolean;
  onToggle: (n: string, expand: boolean) => void;
  onPin: (n: string) => void;
  onSelectTerm: (canonical: string) => void;
  onStartEditNote: (n: string) => void;
  onCommitNote: (n: string, text: string) => void;
  onStopEditNote: () => void;
}

const INDENT_BASE = 4;
const INDENT_STEP = 30;

export default function StatementRow({
  n,
  depth,
  state,
  pinned,
  activeTerm,
  note,
  noteEditing,
  marginMode,
  onToggle,
  onPin,
  onSelectTerm,
  onStartEditNote,
  onCommitNote,
  onStopEditNote,
}: Props) {
  const s = statement(n);
  const hasChildren = s.children.length > 0;
  const expanded = hasChildren && state === 'full';
  const indent = INDENT_BASE + depth * INDENT_STEP;
  const hasNote = note !== undefined || noteEditing;

  // Occurrences of the active term hidden inside a collapsed subtree (spec §9).
  const hiddenCount =
    activeTerm && state === 'collapsed' ? subtreeCount(n, activeTerm) - ownCount(n, activeTerm) : 0;

  return (
    <div className="row-group">
      <div className={`row ${pinned ? 'is-pinned' : ''}`} style={{ paddingLeft: indent }}>
        <button
          className={`row-toggle msym ${expanded ? 'is-expanded' : ''} ${hasChildren ? '' : 'is-hidden'}`}
          aria-label={expanded ? `Fold statement ${n}` : `Unfold statement ${n}`}
          aria-expanded={expanded}
          tabIndex={hasChildren ? 0 : -1}
          title={hasChildren ? (expanded ? 'fold' : 'unfold one level') : undefined}
          onClick={hasChildren ? () => onToggle(n, !expanded) : undefined}
        >
          chevron_right
        </button>
        <span className="row-num">{n}</span>
        <span className="row-text">
          <StatementText text={s.text} activeTerm={activeTerm} onSelectTerm={onSelectTerm} />
        </span>
        {hiddenCount > 0 && (
          <span className="row-badge-wrap">
            <span className="row-badge">{hiddenCount}</span>
            <span className="badge-tip" role="tooltip">
              {hiddenCount} more with "{activeTerm}"
            </span>
          </span>
        )}
        {!hasNote && (
          <button
            className="row-note-btn msym"
            aria-label={`Add note to statement ${n}`}
            title="add note"
            onClick={() => onStartEditNote(n)}
          >
            edit_note
          </button>
        )}
        <button
          className={`row-pin msym ${pinned ? 'is-pinned' : ''}`}
          aria-label={pinned ? `Unpin statement ${n}` : `Pin statement ${n}`}
          aria-pressed={pinned}
          title={pinned ? 'unpin' : 'pin'}
          onClick={() => onPin(n)}
        >
          push_pin
        </button>
      </div>
      {hasNote && (
        <AnnotationNote
          n={n}
          indent={indent}
          text={note ?? ''}
          editing={noteEditing}
          marginMode={marginMode}
          onStartEdit={() => onStartEditNote(n)}
          onCommit={(text) => onCommitNote(n, text)}
          onStopEdit={onStopEditNote}
        />
      )}
    </div>
  );
}
