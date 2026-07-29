/*
  The single-key shortcut kill switch (WCAG 2.1.4, Level A).

  j/k/p/s/Enter/arrows are focus-scoped to the tree, but `/` and `?` stay global
  so they work while reading — which means the app must offer a way to turn
  single-key shortcuts OFF. Speech-input and switch-device users emit bare
  characters constantly; without this they cannot use the page at all.

  Same shape as useTheme (src/theme.ts): a module-level listener set behind
  useSyncExternalStore, persisted to localStorage, degrading quietly when
  storage is unavailable (private mode).
*/

import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'ft-shortcuts';
const listeners = new Set<() => void>();

// Cached so the useSyncExternalStore snapshot is referentially stable — reading
// localStorage on every render would be wasteful, and throwing in private mode
// would break the subscription.
let enabled: boolean = read();

function read(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

function current(): boolean {
  return enabled;
}

function set(next: boolean) {
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? 'on' : 'off');
  } catch {
    // private mode etc. — the choice simply won't persist
  }
  listeners.forEach((l) => l());
}

export function useShortcuts(): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore((cb) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  }, current);
  return [value, useCallback((next: boolean) => set(next), [])];
}
