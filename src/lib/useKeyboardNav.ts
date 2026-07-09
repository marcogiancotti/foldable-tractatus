/*
  Keyboard navigation (spec §12): arrows + j/k move between visible statements
  (roving focus over [data-nav] elements), →/←/⇧→ fold, P pins, Enter opens
  the note, / focuses search, ? opens the guide, Esc clears, Ctrl/⌘Z / Ctrl+Y
  (or ⌘⇧Z) drive the in-app history. Never wired to browser Back.
*/

import { useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  toggleRow: (n: string, expand: boolean) => void;
  expandSubtree: (n: string) => void;
  promotePeeks: (members: string[]) => void;
  togglePin: (n: string) => void;
  editNote: (n: string) => void;
  focusSearch: () => void;
  openHelp: () => void;
  escape: () => void;
  undo: () => void;
  redo: () => void;
}

interface NavTarget {
  el: HTMLElement;
  n?: string; // statement row
  peekMembers?: string[]; // peek range row
  expanded?: boolean;
  hasChildren?: boolean;
}

function navTargets(): NavTarget[] {
  return [...document.querySelectorAll<HTMLElement>('[data-nav]')].map((el) => ({
    el,
    n: el.dataset.n,
    peekMembers: el.dataset.peekMembers?.split(','),
    expanded: el.dataset.expanded === '1',
    hasChildren: el.dataset.hasChildren === '1',
  }));
}

function currentTarget(): NavTarget | null {
  const el = document.activeElement?.closest<HTMLElement>('[data-nav]');
  if (!el) return null;
  return navTargets().find((t) => t.el === el) ?? null;
}

export function useKeyboardNav(handlers: KeyboardHandlers) {
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      // history works everywhere except while typing
      if ((e.ctrlKey || e.metaKey) && !typing) {
        const k = e.key.toLowerCase();
        if (k === 'z') {
          e.preventDefault();
          if (e.shiftKey) h.current.redo();
          else h.current.undo();
          return;
        }
        if (k === 'y') {
          e.preventDefault();
          h.current.redo();
          return;
        }
      }
      if (typing || e.ctrlKey || e.metaKey || e.altKey) {
        if (!typing && e.key === 'Escape') h.current.escape();
        return;
      }

      const move = (delta: 1 | -1) => {
        e.preventDefault();
        const targets = navTargets();
        if (!targets.length) return;
        const cur = document.activeElement?.closest<HTMLElement>('[data-nav]');
        const idx = targets.findIndex((t) => t.el === cur);
        const next = targets[idx === -1 ? (delta === 1 ? 0 : targets.length - 1) : idx + delta];
        next?.el.focus();
      };

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          move(1);
          return;
        case 'ArrowUp':
        case 'k':
          move(-1);
          return;
        case 'ArrowRight': {
          const t = currentTarget();
          if (!t) return;
          e.preventDefault();
          if (t.peekMembers) h.current.promotePeeks(t.peekMembers);
          else if (t.n && t.hasChildren) {
            if (e.shiftKey) h.current.expandSubtree(t.n);
            else if (!t.expanded) h.current.toggleRow(t.n, true);
          }
          return;
        }
        case 'ArrowLeft': {
          const t = currentTarget();
          if (t?.n && t.expanded) {
            e.preventDefault();
            h.current.toggleRow(t.n, false);
          }
          return;
        }
        case 'p':
        case 'P': {
          const t = currentTarget();
          if (t?.n) h.current.togglePin(t.n);
          return;
        }
        case 'Enter': {
          const t = currentTarget();
          if (t?.n && document.activeElement === t.el) {
            e.preventDefault();
            h.current.editNote(t.n);
          }
          return;
        }
        case '/':
          e.preventDefault();
          h.current.focusSearch();
          return;
        case '?':
          e.preventDefault();
          h.current.openHelp();
          return;
        case 'Escape':
          h.current.escape();
          return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
