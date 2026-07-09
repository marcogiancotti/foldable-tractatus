import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ConfirmModal from './components/ConfirmModal';
import ControlPanel from './components/ControlPanel';
import ReadingColumn from './components/ReadingColumn';
import TermCard from './components/TermCard';
import UndoToast from './components/UndoToast';
import { READING_PATHS, pathById } from './data/paths';
import { useKeyboardNav } from './lib/useKeyboardNav';
import { useMediaQuery } from './lib/useMediaQuery';
import { deriveDisplay } from './model/focusedView';
import { matchingStatements, ownCount } from './model/match';
import { STATEMENTS } from './model/tree';
import { StoreProvider, useStore } from './state/store';
import { MAX_THREADS, useThreads } from './state/threads';

function AppInner() {
  const { state, dispatch } = useStore();
  const threadsApi = useThreads();
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  const [confirmPinOnly, setConfirmPinOnly] = useState(false);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const marginMode = useMediaQuery('(min-width: 1180px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Cross-ref / deep-link navigation: reveal → scroll to ~30% viewport → flash.
  const [flashN, setFlashN] = useState<string | null>(null);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const navigateToStatement = (n: string) => {
    dispatch({ type: 'reveal', n });
    setPendingScroll(n);
  };
  useEffect(() => {
    if (!pendingScroll) return;
    const el = document.querySelector<HTMLElement>(`[data-n="${CSS.escape(pendingScroll)}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      window.scrollTo({
        top: window.scrollY + rect.top - window.innerHeight * 0.3,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
      el.focus({ preventScroll: true });
      setFlashN(pendingScroll);
      clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashN(null), 1600);
    }
    setPendingScroll(null);
  }, [pendingScroll, reducedMotion]);

  useKeyboardNav({
    toggleRow: (n, expand) => dispatch({ type: 'toggleRow', n, expand }),
    expandSubtree: (n) => dispatch({ type: 'expandSubtree', n }),
    promotePeeks: (members) => dispatch({ type: 'promotePeeks', members }),
    togglePin: (n) => dispatch({ type: 'togglePin', n }),
    editNote: (n) => setEditingNote(n),
    focusSearch: () => searchRef.current?.focus(),
    openHelp: () => setHelpOpen(true),
    escape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (state.activeTerm) dispatch({ type: 'setTerm', term: null });
      else (document.activeElement as HTMLElement | null)?.blur?.();
    },
    undo: () => dispatch({ type: 'undo' }),
    redo: () => dispatch({ type: 'redo' }),
  });

  const display = useMemo(
    () => deriveDisplay(state.pins, state.overrides),
    [state.pins, state.overrides],
  );

  const term = state.activeTerm;
  const termStats = useMemo(() => {
    if (!term) return null;
    return {
      matches: matchingStatements(term, STATEMENTS),
      occurrences: STATEMENTS.reduce((sum, s) => sum + ownCount(s.n, term), 0),
    };
  }, [term]);

  // Align the sticky panel's top with the first proposition (handoff 01 §2).
  const rootRef = useRef<HTMLDivElement>(null);
  const firstRowRef = useRef<HTMLDivElement>(null);
  const [panelTop, setPanelTop] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const root = rootRef.current;
      const marker = firstRowRef.current;
      if (!root || !marker) return;
      const top = marker.getBoundingClientRect().top - root.getBoundingClientRect().top;
      setPanelTop((prev) => (Math.abs(prev - top) > 1 ? top : prev));
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const applyPinSet = (pins: string[], name: string, pathId?: string) =>
    dispatch({
      type: 'applyPins',
      pins,
      mode: 'replace',
      pathId,
      message: `Pins replaced — "${name}" (${pins.length} pin${pins.length === 1 ? '' : 's'})`,
    });

  const setTerm = (value: string) =>
    dispatch({ type: 'setTerm', term: value.trim() ? value : null });

  const matchCount = termStats?.matches.length ?? 0;

  return (
    <div className="app-root" ref={rootRef}>
      <div className="panel-col">
        <div className="panel-sticky" style={{ marginTop: panelTop }}>
          <ControlPanel
            canUndo={state.past.length > 0}
            canRedo={state.future.length > 0}
            onFoldAll={() => dispatch({ type: 'foldAll' })}
            onUnfoldAll={() => dispatch({ type: 'unfoldAll' })}
            onUndo={() => dispatch({ type: 'undo' })}
            onRedo={() => dispatch({ type: 'redo' })}
            onHelp={() => setHelpOpen(true)}
            onShare={() => {}}
            onExportMarkdown={() => {}}
            onExportPdf={() => {}}
            presets={READING_PATHS}
            threads={threadsApi.threads}
            maxThreads={MAX_THREADS}
            onApplyPreset={(id) => {
              const p = pathById.get(id);
              if (p) applyPinSet(p.pins, p.name, p.id);
            }}
            onApplyThread={(id) => {
              const t = threadsApi.threads.find((t) => t.id === id);
              if (t) applyPinSet(t.pins, t.name);
            }}
            onSaveThread={(name) => threadsApi.save(name, [...state.pins])}
            onRenameThread={threadsApi.rename}
            onOverwriteThread={(id) => threadsApi.overwrite(id, [...state.pins])}
            onDeleteThread={threadsApi.remove}
            pinCount={state.pins.size}
            searchValue={term ?? ''}
            onSearchChange={setTerm}
            onClearTerm={() => setTerm('')}
            termActive={term !== null}
            termCount={termStats?.occurrences ?? 0}
            searchRef={searchRef}
            onOpenChange={setPanelOpen}
          />
          {term && termStats && (
            <TermCard
              term={term}
              occurrences={termStats.occurrences}
              statementCount={matchCount}
              narrow={!panelOpen}
              onClear={() => setTerm('')}
              onPinOnly={() => setConfirmPinOnly(true)}
              onAddPins={() => dispatch({ type: 'applyPins', pins: termStats.matches, mode: 'add' })}
            />
          )}
        </div>
      </div>
      <ReadingColumn
        display={display}
        pins={state.pins}
        activeTerm={term}
        notes={state.notes}
        editingNote={editingNote}
        flashN={flashN}
        marginMode={marginMode}
        onToggle={(n, expand) => dispatch({ type: 'toggleRow', n, expand })}
        onPromote={(members) => dispatch({ type: 'promotePeeks', members })}
        onPin={(n) => dispatch({ type: 'togglePin', n })}
        onSelectTerm={(canonical) => dispatch({ type: 'setTerm', term: canonical })}
        onNavigate={navigateToStatement}
        onStartEditNote={setEditingNote}
        onCommitNote={(n, text) => dispatch({ type: 'setNote', n, text })}
        onStopEditNote={() => {
          setEditingNote(null);
          dispatch({ type: 'endNoteEdit' });
        }}
        firstRowRef={firstRowRef}
      />
      <div className="note-rail" aria-hidden="true" />
      <UndoToast
        toast={state.toast}
        onUndo={() => dispatch({ type: 'undo' })}
        onDismiss={() => dispatch({ type: 'dismissToast' })}
      />
      <ConfirmModal
        request={
          confirmPinOnly && term && termStats
            ? {
                title: 'Replace your current pins?',
                body:
                  `This pins only the ${matchCount} statement${matchCount === 1 ? '' : 's'} ` +
                  `containing "${term}" and clears your current pins. This is undoable.`,
                confirmLabel: 'Replace pins',
              }
            : null
        }
        onConfirm={() => {
          if (term && termStats) {
            dispatch({
              type: 'applyPins',
              pins: termStats.matches,
              mode: 'replace',
              message:
                `Pins replaced — ${matchCount} statement${matchCount === 1 ? '' : 's'} ` +
                `with "${term}"`,
            });
          }
          setConfirmPinOnly(false);
        }}
        onCancel={() => setConfirmPinOnly(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
