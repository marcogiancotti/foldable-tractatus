import { ROOT_IDS, STATEMENTS } from '../model/tree';
import StatementRow from './StatementRow';

interface Props {
  annotationCount?: number;
}

export default function ReadingColumn({ annotationCount = 0 }: Props) {
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
        {STATEMENTS.map((s) => (
          <StatementRow key={s.n} statement={s} expanded={s.children.length > 0} />
        ))}
      </section>
    </main>
  );
}
