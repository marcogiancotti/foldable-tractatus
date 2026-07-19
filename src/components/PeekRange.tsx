import type { CSSProperties } from 'react';
import { subtreeCount } from '../model/match';

interface Props {
  depth: number;
  members: string[];
  label: string;
  activeTerm: string | null;
  onPromote: (members: string[]) => void;
}

export default function PeekRange({ depth, members, label, activeTerm, onPromote }: Props) {
  const title = members.length === 1 ? 'reveal statement' : `reveal ${members.length} statements`;
  const count = activeTerm
    ? members.reduce((sum, m) => sum + subtreeCount(m, activeTerm), 0)
    : 0;
  return (
    <button
      className="peek-row"
      style={{ '--depth': depth } as CSSProperties}
      title={title}
      aria-label={`${title}: ${label}`}
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
          <span className="peek-badge">{count}</span>
          <span className="badge-tip" role="tooltip">
            {count} occurrence{count === 1 ? '' : 's'} of "{activeTerm}"
          </span>
        </span>
      )}
    </button>
  );
}
