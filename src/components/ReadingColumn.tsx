import type { DisplayItem } from '../model/focusedView';
import { ROOT_IDS, STATEMENTS } from '../model/tree';
import PeekRange from './PeekRange';
import StatementRow from './StatementRow';

interface Props {
  display: DisplayItem[];
  onToggle: (n: string, expand: boolean) => void;
  onPromote: (members: string[]) => void;
  annotationCount?: number;
}

export default function ReadingColumn({
  display,
  onToggle,
  onPromote,
  annotationCount = 0,
}: Props) {
  return (
    <main className="reading-col">
      <header>
        <div style={{ maxWidth: 640 }}>
          <h1 className="rc-h1">
            The Foldable
            <br />
            Tractatus
          </h1>
          <p className="rc-intro">
            The book is built as a tree. Seven numbered propositions, each branching into
            decimal remarks that comment on the one above. Read it folded — open a line to
            see what supports it, pin a word to trace it through the whole, keep your notes
            in the margin.
          </p>
        </div>
        <div className="rc-meta">
          <span className="rc-meta-dot" />
          <span>{STATEMENTS.length} statements</span>
          <span className="rc-meta-sep">/</span>
          <span>{ROOT_IDS.length} branches</span>
          {annotationCount > 0 && (
            <>
              <span className="rc-meta-sep">/</span>
              <span className="rc-meta-notes">
                {annotationCount} annotation{annotationCount === 1 ? '' : 's'}
              </span>
            </>
          )}
        </div>
        <div className="rc-rule" />
        <div className="rc-book-title">Tractatus Logico-Philosophicus</div>
        <div className="rc-book-byline">Ludwig Wittgenstein, 1922 (Ogden translation)</div>
      </header>
      <section aria-label="Statements">
        {display.map((item) =>
          item.kind === 'row' ? (
            <StatementRow
              key={item.n}
              n={item.n}
              depth={item.depth}
              state={item.state}
              onToggle={onToggle}
            />
          ) : (
            <PeekRange
              key={`peek-${item.members[0]}`}
              depth={item.depth}
              members={item.members}
              label={item.label}
              onPromote={onPromote}
            />
          ),
        )}
      </section>
    </main>
  );
}
