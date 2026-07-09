import { useCallback, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'ft-theme';
const listeners = new Set<() => void>();

function current(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function set(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode etc. — theme simply won't persist
  }
  listeners.forEach((l) => l());
}

// Follow OS changes unless the user has chosen explicitly.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  if (stored !== 'light' && stored !== 'dark') {
    document.documentElement.dataset.theme = e.matches ? 'dark' : 'light';
    listeners.forEach((l) => l());
  }
});

export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    current,
  );
  const toggle = useCallback(() => set(current() === 'dark' ? 'light' : 'dark'), []);
  return [theme, toggle];
}
