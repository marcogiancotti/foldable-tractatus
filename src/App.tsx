import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import ReadingColumn from './components/ReadingColumn';
import UndoToast from './components/UndoToast';
import { READING_PATHS, pathById } from './data/paths';
import { deriveDisplay } from './model/focusedView';
import { StoreProvider, useStore } from './state/store';
import { MAX_THREADS, useThreads } from './state/threads';

function AppInner() {
  const { state, dispatch } = useStore();
  const threadsApi = useThreads();
  const searchRef = useRef<HTMLInputElement>(null);

  const display = useMemo(
    () => deriveDisplay(state.pins, state.overrides),
    [state.pins, state.overrides],
  );

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
            onHelp={() => {}}
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
            searchValue={state.activeTerm ?? ''}
            onSearchChange={() => {}}
            onClearTerm={() => dispatch({ type: 'setTerm', term: null })}
            termActive={state.activeTerm !== null}
            termCount={0}
            searchRef={searchRef}
          />
        </div>
      </div>
      <ReadingColumn
        display={display}
        pins={state.pins}
        onToggle={(n, expand) => dispatch({ type: 'toggleRow', n, expand })}
        onPromote={(members) => dispatch({ type: 'promotePeeks', members })}
        onPin={(n) => dispatch({ type: 'togglePin', n })}
        firstRowRef={firstRowRef}
        annotationCount={Object.keys(state.notes).length}
      />
      <div className="note-rail" aria-hidden="true" />
      <UndoToast
        toast={state.toast}
        onUndo={() => dispatch({ type: 'undo' })}
        onDismiss={() => dispatch({ type: 'dismissToast' })}
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
