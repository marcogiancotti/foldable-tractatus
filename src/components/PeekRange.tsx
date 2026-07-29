import type { CSSProperties } from 'react';
import { subtreeCount } from '../model/match';

interface Props {
  depth: number;
  members: string[];
  label: string;
  activeTerm: string | null;
  /** aria-level / aria-posinset / aria-setsize (model/ariaTree) */
  level: number;
  posinset: number;
  setsize: number;
  /** the single row in the tab order — the tree is one tab stop (roving tabindex) */
  tabbable: boolean;
  onPromote: (members: string[]) => void;
}

export default function PeekRange({
  depth,
  members,
  label,
  activeTerm,
  level,
  posinset,
  setsize,
  tabbable,
  onPromote,
}: Props) {
  const title = members.length === 1 ? 'reveal statement' : `reveal ${members.length} statements`;
  const count = activeTerm
    ? members.reduce((sum, m) => sum + subtreeCount(m, activeTerm), 0)
    : 0;
  return (
    // A peek range is one collapsed node in the tree, not N — it reveals as a
    // unit, so it counts as a single sibling and reports itself unexpanded.
    <button
      className="peek-row"
      style={{ '--depth': depth } as CSSProperties}
      role="treeitem"
      aria-level={level}
      aria-posinset={posinset}
      aria-setsize={setsize}
      aria-expanded={false}
      title={title}
      aria-label={`${title}: ${label}`}
      tabIndex={tabbable ? 0 : -1}
      data-nav=""
      data-peek-members={members.join(',')}
      onClick={() => onPromote(members)}
    >
      {depth > 0 && (
        <span className="depth-rails" aria-hidden="true">
          {Array.from({ length: depth }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      )}
      <span className="peek-toggle msym" aria-hidden="true">
        unfold_more
      </span>
      <span className="peek-label">{label}</span>
      {count > 0 && (
        <span className="row-badge-wrap">
          <span
            className="peek-badge"
            role="img"
            aria-label={`${count} occurrence${count === 1 ? '' : 's'} of "${activeTerm}" inside`}
          >
            {count}
          </span>
          <span className="badge-tip" aria-hidden="true">
            {count} occurrence{count === 1 ? '' : 's'} of "{activeTerm}"
          </span>
        </span>
      )}
    </button>
  );
}
