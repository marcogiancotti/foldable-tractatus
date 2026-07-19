import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import ConfirmModal, { type ConfirmRequest } from './components/ConfirmModal';
import ControlPanel from './components/ControlPanel';
import { MobileBar, MobileSheet } from './components/MobileControls';
import ReadingColumn from './components/ReadingColumn';
import TermCard from './components/TermCard';
import UndoToast from './components/UndoToast';
import { READING_PATHS, pathById } from './data/paths';
import PrintView from './components/PrintView';
import ReaderGuide from './components/ReaderGuide';
import { copyText } from './lib/clipboard';
import {
  fetchBundle,
  sanitizeBundlePayload,
  syncAvailable,
  SyncError,
  uploadBundle,
  type BundlePayload,
} from './lib/sync/client';
import { decryptBundle, encryptBundle, generateKey } from './lib/sync/crypto';
import { downloadMarkdown, exportSelection, toMarkdown } from './lib/export';
import { useKeyboardNav } from './lib/useKeyboardNav';
import { useMediaQuery } from './lib/useMediaQuery';
import { deriveDisplay } from './model/focusedView';
import { encodeViewState, statementParam } from './model/urlState';
import { matchingStatements, ownCount } from './model/match';
import { STATEMENTS } from './model/tree';
import { StoreProvider, useStore } from './state/store';
import { MAX_THREADS, useThreads } from './state/threads';
import { useTheme } from './theme';

/*
  One pending action awaiting the reader's confirmation (spec §4/§9/§11):
  loading a notes bundle, "Pin only these", applying a reading path / saved
  thread over existing pins, unpinning everything, or deleting a saved thread
  (the only one that is NOT undoable — threads live outside history). All of
  them destroy state, so all go through the same ConfirmModal.
*/
type PendingConfirm =
  | { kind: 'import'; payload: BundlePayload }
  | { kind: 'pinOnly' }
  | { kind: 'applySet'; source: 'path' | 'thread'; pins: string[]; name: string; pathId?: string }
  | { kind: 'unpinAll' }
  | { kind: 'deleteThread'; id: string; name: string; pins: number }
  | { kind: 'deleteNote'; n: string };

function AppInner() {
  const { state, dispatch } = useStore();
  const threadsApi = useThreads();
  const [theme, toggleTheme] = useTheme();
  const searchRef = useRef<HTMLInputElement>(null);
  const [panelOpen, setPanelOpen] = useState(true);
  // `/` must work with the panel collapsed: open it first, focus after render.
  const [searchFocusPending, setSearchFocusPending] = useState(false);
  useEffect(() => {
    if (!searchFocusPending) return;
    searchRef.current?.focus();
    setSearchFocusPending(false);
  }, [searchFocusPending]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const marginMode = useMediaQuery('(min-width: 1180px)');
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  // ≤719px: no panel column — the control panel lives in a bottom sheet
  const mobile = useMediaQuery('(max-width: 719px)');
  const [sheetOpen, setSheetOpen] = useState(false);

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

  // A ?statement=N deep link lands on the statement (store already isolated it).
  useEffect(() => {
    const n = statementParam(location.search);
    if (n) setPendingScroll(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Inbound encrypted bundle: ?bundle=<id> with the key in the #k= fragment.
  // Captured during the first render, before the URL-sync effect rewrites it.
  const [inboundBundle] = useState(() => {
    const id = new URLSearchParams(location.search).get('bundle');
    const key = new URLSearchParams(location.hash.slice(1)).get('k');
    return id && key ? { id, key } : null;
  });
  useEffect(() => {
    if (!inboundBundle) return;
    let cancelled = false;
    (async () => {
      try {
        const bundle = await fetchBundle(inboundBundle.id);
        const payload = sanitizeBundlePayload(
          await decryptBundle(bundle, inboundBundle.key),
        );
        if (cancelled) return;
        if (payload) setPendingConfirm({ kind: 'import', payload });
        else dispatch({ type: 'toast', message: 'This link holds no readable notes' });
      } catch {
        if (!cancelled) {
          dispatch({ type: 'toast', message: "Couldn't open the saved notes in this link" });
        }
      } finally {
        // Drop the key fragment either way — it has no business lingering.
        history.replaceState(null, '', location.pathname + location.search);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboundBundle]);

  const saveToLink = async () => {
    try {
      const key = generateKey();
      const bundle = await encryptBundle(
        { notes: state.notes, pins: [...state.pins] },
        key,
      );
      const id = await uploadBundle(bundle);
      const link = `${location.origin}${location.pathname}?bundle=${encodeURIComponent(id)}#k=${key}`;
      const ok = await copyText(link);
      dispatch({
        type: 'toast',
        message: ok
          ? 'Private link copied — notes encrypted in your browser'
          : `Saved. Copy the link manually: ${link}`,
      });
    } catch (err) {
      dispatch({
        type: 'toast',
        message:
          err instanceof SyncError && err.status === 429
            ? 'Save limit reached — try again in an hour'
            : "Couldn't save your notes — try again later",
      });
    }
  };

  // Keep the link in sync with the view state (spec §7) — replaceState only,
  // never pushState: in-app history stays off the browser Back button (§12).
  useEffect(() => {
    const qs = encodeViewState({
      pins: state.pins,
      overrides: state.overrides,
      activeTerm: state.activeTerm,
      activePath: state.activePath,
    });
    const url = (qs ? `${location.pathname}?${qs}` : location.pathname) + location.hash;
    history.replaceState(null, '', url);
  }, [state.pins, state.overrides, state.activeTerm, state.activePath]);

  const noteCount = Object.keys(state.notes).length;
  const printEntries = useMemo(
    () => exportSelection(state.pins, state.notes),
    [state.pins, state.notes],
  );
  const exportMarkdown = () => {
    downloadMarkdown(toMarkdown(printEntries, state.pins.size, noteCount));
    dispatch({ type: 'toast', message: 'Markdown export downloaded' });
  };
  const exportPdf = () => window.print();

  const shareView = async () => {
    const ok = await copyText(location.href);
    dispatch({
      type: 'toast',
      message: ok ? 'Link to this view copied to clipboard' : "Couldn't copy the link",
    });
  };

  // Copies a deep link only — the local view must not change (spec §12).
  const shareStatement = async (n: string) => {
    const link = `${location.origin}${location.pathname}?statement=${encodeURIComponent(n)}`;
    const ok = await copyText(link);
    dispatch({
      type: 'toast',
      message: ok ? `Link to statement ${n} copied` : "Couldn't copy the link",
    });
  };

  useKeyboardNav({
    toggleRow: (n, expand) => dispatch({ type: 'toggleRow', n, expand }),
    expandSubtree: (n) => dispatch({ type: 'expandSubtree', n }),
    promotePeeks: (members) => dispatch({ type: 'promotePeeks', members }),
    togglePin: (n) => dispatch({ type: 'togglePin', n }),
    editNote: (n) => setEditingNote(n),
    focusSearch: () => {
      setPanelOpen(true);
      if (mobile) setSheetOpen(true); // the panel only renders inside the sheet
      setSearchFocusPending(true);
    },
    openHelp: () => setHelpOpen(true),
    escape: () => {
      if (helpOpen) setHelpOpen(false);
      else if (sheetOpen) setSheetOpen(false);
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

  // Applying a path/thread replaces the pins, so existing pins get a confirm
  // first (spec §11); with nothing to overwrite it applies immediately.
  const requestApplyPinSet = (
    source: 'path' | 'thread',
    pins: string[],
    name: string,
    pathId?: string,
  ) => {
    if (state.pins.size === 0) applyPinSet(pins, name, pathId);
    else setPendingConfirm({ kind: 'applySet', source, pins, name, pathId });
  };

  const setTerm = (value: string) =>
    dispatch({ type: 'setTerm', term: value.trim() ? value : null });

  const matchCount = termStats?.matches.length ?? 0;

  const confirmRequest = ((): ConfirmRequest | null => {
    if (!pendingConfirm) return null;
    switch (pendingConfirm.kind) {
      case 'import': {
        const notes = Object.keys(pendingConfirm.payload.notes).length;
        const pins = pendingConfirm.payload.pins.length;
        return {
          title: 'Load shared pins and notes?',
          body:
            `Someone shared ${notes} annotation${notes === 1 ? '' : 's'} and ` +
            `${pins} pin${pins === 1 ? '' : 's'} with you. ` +
            'Loading them replaces your current annotations and pins. This is undoable.',
          confirmLabel: 'Load',
        };
      }
      case 'pinOnly':
        if (!term || !termStats) return null;
        return {
          title: 'Replace your current pins?',
          body:
            `This pins only the ${matchCount} statement${matchCount === 1 ? '' : 's'} ` +
            `containing "${term}" and clears your current pins. This is undoable.`,
          confirmLabel: 'Yes',
        };
      case 'applySet': {
        const { pins, name } = pendingConfirm;
        return {
          title: 'Replace your current pins?',
          body:
            `"${name}" pins ${pins.length} statement${pins.length === 1 ? '' : 's'} and clears ` +
            `your current ${state.pins.size} pin${state.pins.size === 1 ? '' : 's'}. ` +
            'This is undoable.',
          confirmLabel: 'Yes',
        };
      }
      case 'unpinAll': {
        const n = state.pins.size;
        return {
          title: 'Remove all pins?',
          body:
            `This unpins all ${n} statement${n === 1 ? '' : 's'}. ` +
            'Open branches and your notes stay. This is undoable.',
          confirmLabel: 'Yes',
        };
      }
      case 'deleteThread': {
        const { name, pins } = pendingConfirm;
        return {
          title: 'Delete this thread?',
          body:
            `"${name}" (${pins} pin${pins === 1 ? '' : 's'}) will be deleted from this ` +
            'browser. Threads are outside undo history — this cannot be undone.',
          confirmLabel: 'Yes',
        };
      }
      case 'deleteNote':
        return {
          title: 'Delete this note?',
          body: `The note on statement ${pendingConfirm.n} will be removed. This is undoable.`,
          confirmLabel: 'Yes',
        };
    }
  })();

  const confirmPending = () => {
    if (!pendingConfirm) return;
    switch (pendingConfirm.kind) {
      case 'import':
        dispatch({ type: 'importBundle', ...pendingConfirm.payload });
        break;
      case 'pinOnly':
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
        break;
      case 'applySet':
        applyPinSet(pendingConfirm.pins, pendingConfirm.name, pendingConfirm.pathId);
        break;
      case 'unpinAll':
        dispatch({ type: 'clearPins' });
        break;
      case 'deleteThread':
        threadsApi.remove(pendingConfirm.id);
        dispatch({ type: 'toast', message: `Thread "${pendingConfirm.name}" deleted` });
        break;
      case 'deleteNote':
        // empty text deletes the key (store); its own undo step — the modal
        // stole focus, so the editor already blurred and ended its edit run
        dispatch({ type: 'setNote', n: pendingConfirm.n, text: '' });
        dispatch({ type: 'toast', message: `Note on ${pendingConfirm.n} deleted` });
        break;
    }
    setPendingConfirm(null);
  };

  // One panel instance, homed per breakpoint: the sticky side column on
  // desktop, the bottom sheet on mobile (where it renders forced-open and
  // collapsing its head closes the sheet instead).
  const panel = (
    <ControlPanel
      canUndo={state.past.length > 0}
      canRedo={state.future.length > 0}
      onFoldAll={() => dispatch({ type: 'foldAll' })}
      onUnfoldAll={() => dispatch({ type: 'unfoldAll' })}
      onUndo={() => dispatch({ type: 'undo' })}
      onRedo={() => dispatch({ type: 'redo' })}
      onUnpinAll={() => setPendingConfirm({ kind: 'unpinAll' })}
      onHelp={() => setHelpOpen(true)}
      onShare={shareView}
      onExportMarkdown={exportMarkdown}
      onExportPdf={exportPdf}
      presets={READING_PATHS}
      threads={threadsApi.threads}
      maxThreads={MAX_THREADS}
      onApplyPreset={(id) => {
        const p = pathById.get(id);
        if (p) requestApplyPinSet('path', p.pins, p.name, p.id);
      }}
      onApplyThread={(id) => {
        const t = threadsApi.threads.find((t) => t.id === id);
        if (t) requestApplyPinSet('thread', t.pins, t.name);
      }}
      onSaveThread={(name) => {
        threadsApi.save(name, [...state.pins]);
        dispatch({
          type: 'toast',
          message: `Thread "${name}" saved — Share (under More) copies a link to this view`,
        });
      }}
      onRenameThread={(id, name) => {
        threadsApi.rename(id, name);
        dispatch({ type: 'toast', message: `Thread renamed to "${name}"` });
      }}
      onOverwriteThread={(id) => {
        const t = threadsApi.threads.find((t) => t.id === id);
        threadsApi.overwrite(id, [...state.pins]);
        if (t) {
          dispatch({
            type: 'toast',
            message:
              `Thread "${t.name}" updated — now ` +
              `${state.pins.size} pin${state.pins.size === 1 ? '' : 's'}`,
          });
        }
      }}
      onDeleteThread={(id) => {
        const t = threadsApi.threads.find((t) => t.id === id);
        if (t) {
          setPendingConfirm({
            kind: 'deleteThread',
            id: t.id,
            name: t.name,
            pins: t.pins.length,
          });
        }
      }}
      pinCount={state.pins.size}
      searchValue={term ?? ''}
      onSearchChange={setTerm}
      onClearTerm={() => setTerm('')}
      termActive={term !== null}
      termCount={termStats?.occurrences ?? 0}
      searchRef={searchRef}
      onSearchLeave={() =>
        document.querySelector<HTMLElement>('[data-nav]')?.focus()
      }
      open={mobile ? true : panelOpen}
      onOpenChange={mobile ? (v) => !v && setSheetOpen(false) : setPanelOpen}
      theme={theme}
      onToggleTheme={toggleTheme}
      onSaveToLink={syncAvailable() ? saveToLink : undefined}
    />
  );

  const termCard = term && termStats && (
    <TermCard
      term={term}
      occurrences={termStats.occurrences}
      statementCount={matchCount}
      onClear={() => setTerm('')}
      onPinOnly={() => setPendingConfirm({ kind: 'pinOnly' })}
      onAddPins={() => dispatch({ type: 'applyPins', pins: termStats.matches, mode: 'add' })}
    />
  );

  return (
    // Overlays and the print view sit OUTSIDE .app-root: print.css blanks
    // .app-root wholesale, and display:none on an ancestor is not undoable
    // from a descendant, so .print-view must be a sibling to print at all.
    <>
    <div className="app-root" ref={rootRef}>
      {!mobile && (
        <div className="panel-col">
          <div className="panel-sticky" style={{ marginTop: panelTop }}>
            {panel}
            {termCard}
          </div>
        </div>
      )}
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
        onShare={shareStatement}
        onStartEditNote={setEditingNote}
        onCommitNote={(n, text) => dispatch({ type: 'setNote', n, text })}
        onStopEditNote={() => {
          setEditingNote(null);
          dispatch({ type: 'endNoteEdit' });
        }}
        onDeleteNote={(n) => setPendingConfirm({ kind: 'deleteNote', n })}
        firstRowRef={firstRowRef}
      />
      <div className="note-rail" aria-hidden="true" />
    </div>
    {mobile && (
      <>
        {termCard && !sheetOpen && <div className="mobile-term-dock">{termCard}</div>}
        <MobileBar
          canUndo={state.past.length > 0}
          onSearch={() => {
            setSheetOpen(true);
            setSearchFocusPending(true);
          }}
          onFoldAll={() => dispatch({ type: 'foldAll' })}
          onUnfoldAll={() => dispatch({ type: 'unfoldAll' })}
          onUndo={() => dispatch({ type: 'undo' })}
          onMenu={() => setSheetOpen(true)}
        />
        <MobileSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
          {panel}
        </MobileSheet>
      </>
    )}
    <UndoToast
      toast={state.toast}
      onUndo={() => dispatch({ type: 'undo' })}
      onDismiss={() => dispatch({ type: 'dismissToast' })}
    />
    <ReaderGuide open={helpOpen} onClose={() => setHelpOpen(false)} />
    <PrintView entries={printEntries} pinCount={state.pins.size} noteCount={noteCount} />
    <ConfirmModal
      request={confirmRequest}
      onConfirm={confirmPending}
      onCancel={() => setPendingConfirm(null)}
    />
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  );
}
