import { useMemo, type CSSProperties } from 'react';
import type { RowState } from '../model/focusedView';
import { stripMath } from '../lib/math';
import { ownCount, subtreeCount } from '../model/match';
import { statement } from '../model/tree';
import AnnotationNote from './AnnotationNote';
import StatementText from './StatementText';

/*
  The treeitem's accessible name. Screen readers announce this when moving
  between nodes, so it must be prose: stripMath drops the `$…$` LaTeX and the
  `[[block:ID]]` figure sentinels that would otherwise be read aloud verbatim.
  Truncated because a node NAME should orient the reader, not recite the whole
  statement — the full text is still right there in the node's content.
*/
const LABEL_MAX = 160;

function rowLabel(n: string, text: string): string {
  const prose = stripMath(text).replace(/\s+/g, ' ').trim();
  if (prose.length <= LABEL_MAX) return `${n}. ${prose}`;
  const cut = prose.slice(0, LABEL_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  return `${n}. ${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

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
  /** aria-level / aria-posinset / aria-setsize (model/ariaTree) */
  level: number;
  posinset: number;
  setsize: number;
  /** the single row in the tab order — the tree is one tab stop (roving tabindex) */
  tabbable: boolean;
  onToggle: (n: string, expand: boolean) => void;
  onPin: (n: string) => void;
  onSelectTerm: (canonical: string) => void;
  onNavigate: (target: string, origin?: string) => void;
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
  level,
  posinset,
  setsize,
  tabbable,
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
  const label = useMemo(() => rowLabel(n, s.text), [n, s.text]);

  // Occurrences of the active term hidden inside a collapsed subtree (spec §9).
  const hiddenCount =
    activeTerm && state === 'collapsed' ? subtreeCount(n, activeTerm) - ownCount(n, activeTerm) : 0;

  return (
    /*
      A flattened ARIA tree (no nested role="group" wrappers): the derived
      display list is already flat, so structure rides on aria-level /
      aria-posinset / aria-setsize instead. aria-selected mirrors the pin, which
      is what "selected" means in this app.

      The treeitem is the row-GROUP, not the .row inside it. A tree may only own
      treeitem/group children, and the annotation renders as a sibling of .row —
      so with the role one level down, the note's textarea and buttons leaked
      straight into the tree (axe: aria-required-children, critical). Putting the
      role on the wrapper makes the note part of the node's content, which is
      both valid and true: a statement and its margin note are one node.

      --depth drives the padding indent (desktop) and inline-note alignment.
    */
    <div
      className="row-group"
      style={{ '--depth': depth } as CSSProperties}
      role="treeitem"
      aria-level={level}
      aria-posinset={posinset}
      aria-setsize={setsize}
      aria-selected={pinned}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-label={label}
      tabIndex={tabbable ? 0 : -1}
      data-nav=""
      data-n={n}
      data-expanded={expanded ? '1' : '0'}
      data-has-children={hasChildren ? '1' : '0'}
    >
      <div className={`row ${pinned ? 'is-pinned' : ''} ${flash ? 'is-flash' : ''}`}>
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
          // The row itself carries aria-expanded and is the tab stop; this is a
          // pointer affordance duplicating ←/→, so it stays out of the tab order.
          tabIndex={-1}
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
            {/* cross-ref numbers are linked in place; the containing statement's
                own number rides along as the "back to N" origin */}
            <StatementText
              text={s.text}
              activeTerm={activeTerm}
              onSelectTerm={onSelectTerm}
              refs={s.refs}
              onNavigate={(target) => onNavigate(target, n)}
            />
          </div>
        </span>
        {hiddenCount > 0 && (
          // The count's meaning lived only in a hover tooltip, which never
          // reached keyboard or screen-reader users; the badge now carries it as
          // its own accessible name and .badge-tip is decoration.
          <span className="row-badge-wrap">
            <span
              className="row-badge"
              role="img"
              aria-label={`${hiddenCount} more ${
                hiddenCount === 1 ? 'match' : 'matches'
              } for "${activeTerm}" hidden inside`}
            >
              {hiddenCount}
            </span>
            <span className="badge-tip" aria-hidden="true">
              {hiddenCount} more with "{activeTerm}"
            </span>
          </span>
        )}
        {/* display:contents on desktop (flex items as before); a floating
            corner cluster on mobile so text keeps the full column width */}
        {/*
          All three are tabIndex={-1}: the tree is a single tab stop, so these
          would otherwise add three invisible stops per row (~1,580 unfolded).
          Their keyboard route is Enter / S / P on the focused row, documented in
          the reader guide; they stay clickable and screen-reader reachable.
        */}
        <span className="row-actions">
        {!hasNote && (
          <button
            className="row-note-btn msym"
            aria-label={`Add note to statement ${n}`}
            title="add note"
            tabIndex={-1}
            onClick={() => onStartEditNote(n)}
          >
            edit_note
          </button>
        )}
        <button
          className="row-share-btn msym"
          aria-label={`Copy link to statement ${n}`}
          title="share link"
          tabIndex={-1}
          onClick={() => onShare(n)}
        >
          ios_share
        </button>
        <button
          className={`row-pin msym ${pinned ? 'is-pinned' : ''}`}
          aria-label={pinned ? `Unpin statement ${n}` : `Pin statement ${n}`}
          aria-pressed={pinned}
          title={pinned ? 'unpin' : 'pin'}
          tabIndex={-1}
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
