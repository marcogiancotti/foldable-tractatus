/*
  Modal dialog focus management, shared by ConfirmModal, ReaderGuide and the
  mobile control sheet.

  Two things every modal owes the reader, and none of the three did:

  - A focus TRAP. All three moved focus in on open, but nothing stopped Tab from
    walking straight out into the page behind, where the reader would operate
    controls they cannot see (WCAG 2.4.3).
  - Focus RESTORE. On close, focus fell to <body>, which in a 526-statement
    document means losing your place entirely. We restore the element that was
    focused when the dialog opened.

  Escape handling deliberately stays in the components: App's own escape()
  already closes helpOpen/sheetOpen, and adding a second listener here would
  double-fire it.
*/

import { useEffect, type RefObject } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function focusable(card: HTMLElement): HTMLElement[] {
  return [...card.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    // offsetParent is null for display:none subtrees; a fixed-position card
    // reports null too, hence the rect fallback.
    (el) => el.offsetParent !== null || el.getBoundingClientRect().width > 0,
  );
}

/**
 * @param cardRef  the dialog surface — Tab cycles within it
 * @param open     whether the dialog is currently rendered
 * @param initial  element to focus on open; defaults to the first focusable
 */
export function useDialog(
  cardRef: RefObject<HTMLElement | null>,
  open: boolean,
  initial?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const restoreTo = document.activeElement as HTMLElement | null;

    // Synchronously, not in a rAF: opening a dialog is what blurs whatever the
    // reader was editing, and the annotation editor commits and closes on blur.
    // Deferring the focus move breaks that chain — the note editor stays open
    // behind the modal and its text is never committed.
    const card = cardRef.current;
    if (card) (initial?.current ?? focusable(card)[0] ?? card).focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const card = cardRef.current;
      if (!card) return;
      const items = focusable(card);
      if (!items.length) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;

      // Wrap at both ends, and pull focus back in if it has escaped the card
      // (a click on the scrim can leave activeElement outside).
      if (!card.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Hand focus back to whatever opened the dialog, provided it is still in
      // the document — a thread row can be deleted by the very confirm we are
      // closing, in which case there is nothing to return to.
      if (restoreTo?.isConnected) restoreTo.focus();
    };
  }, [open, cardRef, initial]);
}
