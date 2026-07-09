import type { Statement } from '../model/tree';

interface Props {
  statement: Statement;
  expanded: boolean;
  onToggle?: (n: string) => void;
}

const INDENT_BASE = 4;
const INDENT_STEP = 30;

export default function StatementRow({ statement: s, expanded, onToggle }: Props) {
  const hasChildren = s.children.length > 0;
  return (
    <div className="row-group">
      <div className="row" style={{ paddingLeft: INDENT_BASE + s.depth * INDENT_STEP }}>
        <button
          className={`row-toggle msym ${expanded ? 'is-expanded' : ''} ${hasChildren ? '' : 'is-hidden'}`}
          aria-label={expanded ? `Fold statement ${s.n}` : `Unfold statement ${s.n}`}
          aria-expanded={expanded}
          tabIndex={hasChildren ? 0 : -1}
          onClick={hasChildren ? () => onToggle?.(s.n) : undefined}
        >
          chevron_right
        </button>
        <span className="row-num">{s.n}</span>
        <span className="row-text">{s.text}</span>
      </div>
    </div>
  );
}
