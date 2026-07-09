/*
  User-saved threads: personal named pin-sets, max 5, persisted locally.
  A library, not view state — not part of undo history or the share link.
*/

import { useState } from 'react';

export interface SavedThread {
  id: string;
  name: string;
  pins: string[];
}

export const MAX_THREADS = 5;
const KEY = 'ft-threads';

function load(): SavedThread[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (t): t is SavedThread =>
          !!t &&
          typeof t === 'object' &&
          typeof (t as SavedThread).id === 'string' &&
          typeof (t as SavedThread).name === 'string' &&
          Array.isArray((t as SavedThread).pins),
      )
      .slice(0, MAX_THREADS);
  } catch {
    return [];
  }
}

function persist(threads: SavedThread[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(threads));
  } catch {
    // storage full/unavailable — threads simply won't survive reload
  }
}

export function useThreads() {
  const [threads, setThreads] = useState<SavedThread[]>(load);

  const update = (fn: (prev: SavedThread[]) => SavedThread[]) =>
    setThreads((prev) => {
      const next = fn(prev);
      persist(next);
      return next;
    });

  return {
    threads,
    save: (name: string, pins: string[]) =>
      update((prev) =>
        prev.length >= MAX_THREADS
          ? prev
          : [...prev, { id: crypto.randomUUID(), name, pins }],
      ),
    rename: (id: string, name: string) =>
      update((prev) => prev.map((t) => (t.id === id ? { ...t, name } : t))),
    overwrite: (id: string, pins: string[]) =>
      update((prev) => prev.map((t) => (t.id === id ? { ...t, pins } : t))),
    remove: (id: string) => update((prev) => prev.filter((t) => t.id !== id)),
  };
}
