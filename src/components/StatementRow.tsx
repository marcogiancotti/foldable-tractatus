import type { CSSProperties } from 'react';
import type { RowState } from '../model/focusedView';
import { ownCount, subtreeCount } from '../model/match';
import { statement } from '../model/tree';
import AnnotationNote from './AnnotationNote';
import StatementText from './StatementText';
import XRefPreview from './XRefPreview';

interface Props {
  n: string;
  depth: number;
  state: RowState;
  pinned: boolean;
  flash: boolean;
  activeTerm: string | null;
  note?: string;
  noteEditing: boolean;
  marginMode: boolean;
  onToggle: (n: string, expand: boolean) => void;
  onPin: (n: string) => void;
  onSelectTerm: (canonical: string) => void;
  onNavigate: (n: string) => void;
  onShare: (n: string) => void;
  onStartEditNote: (n: string) => void;
  onCommitNote: (n: string, text: string) => void;
  onStopEditNote: () => void;
  onDeleteNote: (n: string) => void;
}

export default function StatementRow({
  n,
  depth,
  state,
  pinned,
  flash,
  activeTerm,
  note,
  noteEditing,
  marginMode,
  onToggle,
  onPin,
  onSelectTerm,
  onNavigate,
  onShare,
  onStartEditNote,
  onCommitNote,
  onStopEditNote,
  onDeleteNote,
}: Props) {
  const s = statement(n);
  const hasChildren = s.children.length > 0;
  const expanded = hasChildren && state === 'full';
  const hasNote = note !== undefined || noteEditing;

  // Occurrences of the active term hidden inside a collapsed subtree (spec §9).
  const hiddenCount =
    activeTerm && state === 'collapsed' ? subtreeCount(n, activeTerm) - ownCount(n, activeTerm) : 0;

  return (
    // --depth drives the padding indent (desktop) and inline-note alignment
    <div className="row-group" style={{ '--depth': depth } as CSSProperties}>
      <div
        className={`row ${pinned ? 'is-pinned' : ''} ${flash ? 'is-flash' : ''}`}
        tabIndex={-1}
        data-nav=""
        data-n={n}
        data-expanded={expanded ? '1' : '0'}
        data-has-children={hasChildren ? '1' : '0'}
        aria-label={`Statement ${n}`}
      >
        {depth > 0 && (
          <span className="depth-rails" aria-hidden="true">
            {Array.from({ length: depth }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        )}
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
        {/* display:contents on desktop (row-num + row-text stay inline flex
            siblings); mobile.css makes this a block so the number sits on its
            own line above the text (reclaims horizontal space when nested) */}
        <span className="row-body">
          <span className="row-num">{n}</span>
          {/* div (not span): statement text now contains block-level paragraphs
              and figure/table blocks */}
          <div className="row-text">
            <StatementText text={s.text} activeTerm={activeTerm} onSelectTerm={onSelectTerm} />
            {s.refs.length > 0 && <XRefPreview refs={s.refs} onNavigate={onNavigate} />}
          </div>
        </span>
        {hiddenCount > 0 && (
          <span className="row-badge-wrap">
            <span className="row-badge">{hiddenCount}</span>
            <span className="badge-tip" role="tooltip">
              {hiddenCount} more with "{activeTerm}"
            </span>
          </span>
        )}
        {/* display:contents on desktop (flex items as before); a floating
            corner cluster on mobile so text keeps the full column width */}
        <span className="row-actions">
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
          className="row-share-btn msym"
          aria-label={`Copy link to statement ${n}`}
          title="share link"
          onClick={() => onShare(n)}
        >
          ios_share
        </button>
        <button
          className={`row-pin msym ${pinned ? 'is-pinned' : ''}`}
          aria-label={pinned ? `Unpin statement ${n}` : `Pin statement ${n}`}
          aria-pressed={pinned}
          title={pinned ? 'unpin' : 'pin'}
          onClick={() => onPin(n)}
        >
          push_pin
        </button>
        </span>
      </div>
      {hasNote && (
        <AnnotationNote
          n={n}
          text={note ?? ''}
          editing={noteEditing}
          marginMode={marginMode}
          onStartEdit={() => onStartEditNote(n)}
          onCommit={(text) => onCommitNote(n, text)}
          onStopEdit={onStopEditNote}
          onDelete={() => onDeleteNote(n)}
        />
      )}
    </div>
  );
}
