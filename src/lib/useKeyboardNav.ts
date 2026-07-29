/*
  Keyboard navigation (spec §12): arrows + j/k move between visible statements
  (roving focus over [data-nav] elements), →/←/⇧→ fold, P pins, S copies a link,
  Enter opens the note, / focuses search, ? opens the guide, Esc clears,
  Ctrl/⌘Z / Ctrl+Y (or ⌘⇧Z) drive the in-app history. Never wired to browser Back.

  Two accessibility constraints shape the dispatch below (both WCAG Level A):

  1. Single-key shortcuts must be escapable (2.1.4). The tree keys (arrows, j, k,
     p, s, Enter) only fire when focus is already INSIDE the tree — reachable in
     one Tab thanks to the roving tabindex in ReadingColumn. `/` and `?` stay
     global because they are the way in to search from anywhere, so the whole set
     is additionally gated on `enabled`, the reader's kill switch.

  2. Arrow keys must not be swallowed page-wide. Capturing them unconditionally
     meant the page could not be scrolled from the keyboard at all; the focus
     gate is what gives arrow-scrolling back everywhere outside the tree.
*/

import { useEffect, useRef } from 'react';

export interface KeyboardHandlers {
  toggleRow: (n: string, expand: boolean) => void;
  expandSubtree: (n: string) => void;
  promotePeeks: (members: string[]) => void;
  togglePin: (n: string) => void;
  shareStatement: (n: string) => void;
  editNote: (n: string) => void;
  focusSearch: () => void;
  openHelp: () => void;
  escape: () => void;
  undo: () => void;
  redo: () => void;
  /** the reader's single-key shortcut setting (useShortcuts) */
  enabled: boolean;
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

/** The tree node holding focus, or null when focus is anywhere else. */
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
        !!target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      // history works everywhere except while typing, and is never a single-key
      // shortcut, so it is exempt from the kill switch
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

      // Escape is not a single-key shortcut in the 2.1.4 sense (it is a
      // non-printing key that cannot be produced by speech input), so it stays
      // live even with shortcuts switched off.
      if (e.key === 'Escape') {
        h.current.escape();
        return;
      }
      if (!h.current.enabled) return;

      const t = currentTarget();
      const inTree = t !== null;

      const move = (delta: 1 | -1) => {
        e.preventDefault();
        const targets = navTargets();
        if (!targets.length) return;
        const idx = targets.findIndex((x) => x.el === t?.el);
        const next = targets[idx === -1 ? (delta === 1 ? 0 : targets.length - 1) : idx + delta];
        next?.el.focus();
      };

      switch (e.key) {
        // ---- tree keys: only while focus is inside the tree ----
        case 'ArrowDown':
        case 'j':
          if (inTree) move(1);
          return;
        case 'ArrowUp':
        case 'k':
          if (inTree) move(-1);
          return;
        case 'ArrowRight': {
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
          if (t?.n && t.expanded) {
            e.preventDefault();
            h.current.toggleRow(t.n, false);
          }
          return;
        }
        case 'p':
        case 'P': {
          if (t?.n) h.current.togglePin(t.n);
          return;
        }
        case 's':
        case 'S': {
          // The per-row share button is no longer tabbable (it would put ~1,580
          // invisible stops in the tab order), so this is its keyboard route.
          if (t?.n) h.current.shareStatement(t.n);
          return;
        }
        case 'Enter': {
          if (t?.n && document.activeElement === t.el) {
            e.preventDefault();
            h.current.editNote(t.n);
          }
          return;
        }

        // ---- global keys: the way in to search from anywhere ----
        case '/':
          e.preventDefault();
          h.current.focusSearch();
          return;
        case '?':
          e.preventDefault();
          h.current.openHelp();
          return;
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}
