import { useLayoutEffect, useRef, type Ref } from 'react';
import type { DisplayItem } from '../model/focusedView';
import { computeNoteTops } from '../lib/noteLayout';
import { ROOT_IDS, STATEMENTS } from '../model/tree';
import PeekRange from './PeekRange';
import StatementRow from './StatementRow';

interface Props {
  display: DisplayItem[];
  pins: ReadonlySet<string>;
  activeTerm: string | null;
  notes: Readonly<Record<string, string>>;
  editingNote: string | null;
  flashN: string | null;
  marginMode: boolean;
  onToggle: (n: string, expand: boolean) => void;
  onPromote: (members: string[]) => void;
  onPin: (n: string) => void;
  onSelectTerm: (canonical: string) => void;
  onNavigate: (target: string, origin?: string) => void;
  onShare: (n: string) => void;
  onStartEditNote: (n: string) => void;
  onCommitNote: (n: string, text: string) => void;
  onStopEditNote: () => void;
  onDeleteNote: (n: string) => void;
  /** empty marker before the first row — the control panel aligns its top to it */
  firstRowRef?: Ref<HTMLDivElement>;
}

export default function ReadingColumn({
  display,
  pins,
  activeTerm,
  notes,
  editingNote,
  flashN,
  marginMode,
  onToggle,
  onPromote,
  onPin,
  onSelectTerm,
  onNavigate,
  onShare,
  onStartEditNote,
  onCommitNote,
  onStopEditNote,
  onDeleteNote,
  firstRowRef,
}: Props) {
  const annotationCount = Object.keys(notes).length;

  /*
    Margin-note layout (spec §6): notes are absolutely positioned inside their
    own .row-group, so left alone they collide when annotated rows sit close.
    This pass measures every margin note, computes non-overlapping offsets
    (computeNoteTops — the note being edited is the "active" one, pinned to
    its anchor), and writes them back as inline `top`s. Direct DOM writes on
    purpose: measuring and positioning in one place, no re-render loop.
  */
  const colRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const col = colRef.current;
    if (!col) return;
    const wraps = () => [...col.querySelectorAll<HTMLElement>('.note-wrap.is-margin')];
    if (!marginMode) {
      for (const w of wraps()) {
        w.style.top = '';
        w.classList.remove('is-overflowing');
      }
      return;
    }
    const NOTE_TOP = 5; // .note-wrap.is-margin's resting offset within its row
    const GAP = 12;
    const apply = () => {
      const ws = wraps();
      if (ws.length === 0) return;
      const groups = ws.map((w) => w.closest<HTMLElement>('.row-group')!);
      const anchors = groups.map((g) => g.offsetTop + NOTE_TOP);
      const heights = ws.map((w) => w.offsetHeight);
      const activeIdx = editingNote
        ? groups.findIndex(
            (g) => g.querySelector<HTMLElement>('.row')?.dataset.n === editingNote,
          )
        : -1;
      const tops = computeNoteTops(anchors, heights, GAP, activeIdx >= 0 ? activeIdx : null);
      ws.forEach((w, i) => {
        w.style.top = `${tops[i] - groups[i].offsetTop}px`;
        const clamped = w.querySelector<HTMLElement>('.note-clamp');
        w.classList.toggle(
          'is-overflowing',
          clamped !== null && clamped.scrollHeight > clamped.clientHeight + 1,
        );
      });
    };
    apply();
    if (typeof ResizeObserver === 'undefined') return;
    // Re-run on any size change: fonts settling, the editing textarea growing,
    // the column reflowing. Toggling is-overflowing resizes a note once more;
    // the follow-up pass reaches a fixed point and the observer goes quiet.
    const ro = new ResizeObserver(apply);
    ro.observe(col);
    for (const w of wraps()) ro.observe(w);
    return () => ro.disconnect();
  }, [display, notes, editingNote, marginMode]);

  return (
    <main className="reading-col" ref={colRef}>
      <header>
        <div style={{ maxWidth: 640 }}>
          <h1 className="rc-h1">
            The Foldable
            <br />
            Tractatus
          </h1>
          <p className="rc-intro">
            Ludwig Wittgenstein wrote most of the <em>Tractatus Logico-Philosophicus</em>{' '}
            while fighting in World War I. When he was done, he believed this book made
            philosophy obsolete, so he found a job as an elementary school teacher. While he
            would later change his mind on its finality, the Tractatus remains one of the most
            important works of philosophy to this day.
          </p>
          <p className="rc-intro">
            The Tractatus has an unusual shape: it is not a sequence of chapters but a{' '}
            <strong>tree</strong> of statements and sub-statements and sub-sub-statements. In
            other words, it is not a linear read but a branching set of rabbit-holes.
          </p>
          <p className="rc-intro">
            This page is an attempt at making that tree maximally traversable and
            interactive.{' '}
            <strong>
              Use the tools available to explore, make cross-sections, annotate, fold and
              sculpt the book the way you prefer. Save any set of pins as a named thread in
              the control panel, or bookmark the page in your browser. Export the result as a Markdown or PDF file to keep,
              or share a special link that reopens your annotated version of the book in someone else's browser.
            </strong>
          </p>
          <p className="rc-intro rc-intro-fine">
            This is the public-domain C. K. Ogden translation of the Tractatus. For Bertrand
            Russell's introduction, see{' '}
            <a href="https://www.gutenberg.org/ebooks/5740" target="_blank" rel="noreferrer">
              Project Gutenberg
            </a>
            .
          </p>
        </div>
        <div className="rc-meta">
          <span className="rc-meta-line">
            <span className="rc-meta-dot" />
            <span>{STATEMENTS.length} statements</span>
            <span className="rc-meta-sep">/</span>
            <span>{ROOT_IDS.length} branches</span>
          </span>
          {(pins.size > 0 || annotationCount > 0) && (
            <>
              {/* separator between the two groups: on mobile they stack, so it hides */}
              <span className="rc-meta-sep rc-meta-sep-groups">/</span>
              <span className="rc-meta-line">
                {pins.size > 0 && (
                  <span className="rc-meta-accent">
                    {pins.size} pin{pins.size === 1 ? '' : 's'}
                  </span>
                )}
                {pins.size > 0 && annotationCount > 0 && <span className="rc-meta-sep">/</span>}
                {annotationCount > 0 && (
                  <span className="rc-meta-accent">
                    {annotationCount} annotation{annotationCount === 1 ? '' : 's'}
                  </span>
                )}
              </span>
            </>
          )}
        </div>
        <div className="rc-rule" />
        <div className="rc-book-title">Tractatus Logico-Philosophicus</div>
        <div className="rc-book-byline">Ludwig Wittgenstein, 1922 (Ogden translation)</div>
      </header>
      <div ref={firstRowRef} />
      <section aria-label="Statements">
        {display.map((item) =>
          item.kind === 'row' ? (
            <StatementRow
              key={item.n}
              n={item.n}
              depth={item.depth}
              state={item.state}
              pinned={pins.has(item.n)}
              flash={flashN === item.n}
              activeTerm={activeTerm}
              note={notes[item.n]}
              noteEditing={editingNote === item.n}
              marginMode={marginMode}
              onToggle={onToggle}
              onPin={onPin}
              onSelectTerm={onSelectTerm}
              onNavigate={onNavigate}
              onShare={onShare}
              onStartEditNote={onStartEditNote}
              onCommitNote={onCommitNote}
              onStopEditNote={onStopEditNote}
              onDeleteNote={onDeleteNote}
            />
          ) : (
            <PeekRange
              key={`peek-${item.members[0]}`}
              depth={item.depth}
              members={item.members}
              label={item.label}
              activeTerm={activeTerm}
              onPromote={onPromote}
            />
          ),
        )}
      </section>
    </main>
  );
}
