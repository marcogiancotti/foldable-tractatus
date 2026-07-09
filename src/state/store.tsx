/*
  App store: view state (pins, overrides, active term/path), annotations, and
  the in-app undo/redo history (spec §12–13).

  History is snapshot-based: every undoable action pushes {pins, overrides,
  activePath, notes} (immutable objects, structurally shared). The active term
  is view state but NOT part of history (selecting a term is not an "action").
  Pin-replacing actions are single undoable steps and raise the undo toast.
*/

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { loadNotes, saveNotes } from './persistence';
import {
  foldAllOverrides,
  promotePeeks,
  setRowExpansion,
  expandSubtree,
  unfoldAllOverrides,
  type Overrides,
  type Pins,
} from '../model/focusedView';

export const NOTE_LIMIT = 2000;
const HISTORY_LIMIT = 100;

export interface ToastState {
  id: number;
  message: string;
  undoable: boolean;
}

interface Snapshot {
  pins: Pins;
  overrides: Overrides;
  activePath: string | null;
  notes: Readonly<Record<string, string>>;
}

export interface AppState extends Snapshot {
  activeTerm: string | null;
  past: readonly Snapshot[];
  future: readonly Snapshot[];
  /** statement id of an in-progress note edit, so keystroke bursts coalesce into one undo step */
  noteEditing: string | null;
  toast: ToastState | null;
}

export type AppAction =
  | { type: 'toggleRow'; n: string; expand: boolean }
  | { type: 'promotePeeks'; members: string[] }
  | { type: 'expandSubtree'; n: string }
  | { type: 'foldAll' }
  | { type: 'unfoldAll' }
  | { type: 'togglePin'; n: string }
  | { type: 'isolate'; n: string }
  | {
      type: 'applyPins';
      pins: string[];
      mode: 'replace' | 'add';
      pathId?: string;
      message?: string;
    }
  | { type: 'setTerm'; term: string | null }
  | { type: 'setNote'; n: string; text: string }
  | { type: 'endNoteEdit' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'toast'; message: string; undoable?: boolean }
  | { type: 'dismissToast' }
  | { type: 'restore'; view: Partial<Snapshot> & { activeTerm?: string | null } };

export const initialState: AppState = {
  pins: new Set(),
  overrides: new Map(),
  activePath: null,
  notes: {},
  activeTerm: null,
  past: [],
  future: [],
  noteEditing: null,
  toast: null,
};

const snapshotOf = (s: AppState): Snapshot => ({
  pins: s.pins,
  overrides: s.overrides,
  activePath: s.activePath,
  notes: s.notes,
});

let toastSeq = 0;
const makeToast = (message: string, undoable: boolean): ToastState => ({
  id: ++toastSeq,
  message,
  undoable,
});

/** Push the current snapshot onto the undo stack (ends any note-coalescing run). */
function withHistory(s: AppState, next: Partial<AppState>): AppState {
  return {
    ...s,
    ...next,
    past: [...s.past, snapshotOf(s)].slice(-HISTORY_LIMIT),
    future: [],
    noteEditing: null,
  };
}

export function reducer(s: AppState, a: AppAction): AppState {
  switch (a.type) {
    case 'toggleRow':
      return withHistory(s, { overrides: setRowExpansion(s.pins, s.overrides, a.n, a.expand) });

    case 'promotePeeks':
      return withHistory(s, { overrides: promotePeeks(s.pins, s.overrides, a.members) });

    case 'expandSubtree':
      return withHistory(s, { overrides: expandSubtree(s.pins, s.overrides, a.n) });

    case 'foldAll':
      return withHistory(s, { overrides: foldAllOverrides() });

    case 'unfoldAll':
      return withHistory(s, { overrides: unfoldAllOverrides(s.pins) });

    case 'togglePin': {
      const pins = new Set(s.pins);
      if (pins.has(a.n)) pins.delete(a.n);
      else pins.add(a.n);
      return withHistory(s, { pins, activePath: null });
    }

    case 'isolate':
      return withHistory(s, {
        pins: new Set([a.n]),
        overrides: new Map(),
        activePath: null,
        toast: makeToast(`Pinned only statement ${a.n}`, true),
      });

    case 'applyPins': {
      if (a.mode === 'replace') {
        return withHistory(s, {
          pins: new Set(a.pins),
          overrides: new Map(),
          activePath: a.pathId ?? null,
          toast: a.message ? makeToast(a.message, true) : s.toast,
        });
      }
      const pins = new Set(s.pins);
      for (const n of a.pins) pins.add(n);
      return withHistory(s, {
        pins,
        activePath: null,
        toast: a.message ? makeToast(a.message, true) : s.toast,
      });
    }

    case 'setTerm':
      return { ...s, activeTerm: a.term, noteEditing: null };

    case 'setNote': {
      const text = a.text.slice(0, NOTE_LIMIT);
      const notes: Record<string, string> = { ...s.notes };
      if (text.trim() === '') delete notes[a.n];
      else notes[a.n] = text;
      // consecutive edits to the same note are one undo step
      if (s.noteEditing === a.n) return { ...s, notes };
      return { ...withHistory(s, { notes }), noteEditing: a.n };
    }

    case 'endNoteEdit':
      return s.noteEditing === null ? s : { ...s, noteEditing: null };

    case 'undo': {
      if (!s.past.length) return s;
      const prev = s.past[s.past.length - 1];
      return {
        ...s,
        ...prev,
        past: s.past.slice(0, -1),
        future: [snapshotOf(s), ...s.future],
        noteEditing: null,
        toast: null,
      };
    }

    case 'redo': {
      if (!s.future.length) return s;
      const [next, ...future] = s.future;
      return {
        ...s,
        ...next,
        past: [...s.past, snapshotOf(s)],
        future,
        noteEditing: null,
        toast: null,
      };
    }

    case 'toast':
      return { ...s, toast: makeToast(a.message, a.undoable ?? false) };

    case 'dismissToast':
      return { ...s, toast: null };

    case 'restore':
      return { ...s, ...a.view, noteEditing: null };
  }
}

const StoreContext = createContext<{ state: AppState; dispatch: Dispatch<AppAction> } | null>(
  null,
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => ({
    ...init,
    notes: loadNotes(),
  }));
  useEffect(() => saveNotes(state.notes), [state.notes]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore outside StoreProvider');
  return ctx;
}
