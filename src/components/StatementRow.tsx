import type { RowState } from '../model/focusedView';
import { statement } from '../model/tree';

interface Props {
  n: string;
  depth: number;
  state: RowState;
  pinned: boolean;
  onToggle: (n: string, expand: boolean) => void;
  onPin: (n: string) => void;
}

const INDENT_BASE = 4;
const INDENT_STEP = 30;

export default function StatementRow({ n, depth, state, pinned, onToggle, onPin }: Props) {
  const s = statement(n);
  const hasChildren = s.children.length > 0;
  const expanded = hasChildren && state === 'full';
  return (
    <div className="row-group">
      <div
        className={`row ${pinned ? 'is-pinned' : ''}`}
        style={{ paddingLeft: INDENT_BASE + depth * INDENT_STEP }}
      >
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
        <span className="row-text">{s.text}</span>
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
    </div>
  );
}
