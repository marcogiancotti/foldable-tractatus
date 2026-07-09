interface Props {
  depth: number;
  members: string[];
  label: string;
  onPromote: (members: string[]) => void;
}

const INDENT_BASE = 4;
const INDENT_STEP = 30;

export default function PeekRange({ depth, members, label, onPromote }: Props) {
  const title = members.length === 1 ? 'reveal statement' : `reveal ${members.length} statements`;
  return (
    <button
      className="peek-row"
      style={{ paddingLeft: INDENT_BASE + depth * INDENT_STEP }}
      title={title}
      aria-label={`${title}: ${label}`}
      onClick={() => onPromote(members)}
    >
      <span className="peek-toggle msym" aria-hidden="true">
        unfold_more
      </span>
      <span className="peek-label">{label}</span>
    </button>
  );
}
