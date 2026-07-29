/*
  Mobile chrome (≤719px): the side panel column disappears and its contents
  move into a bottom sheet, opened from a fixed bottom bar carrying the
  highest-frequency actions. Styles in mobile.css.
*/

import { useRef, type ReactNode } from 'react';
import { useDialog } from '../lib/useDialog';

interface BarProps {
  canUndo: boolean;
  onSearch: () => void;
  onFoldAll: () => void;
  onUnfoldAll: () => void;
  onUndo: () => void;
  onMenu: () => void;
}

export function MobileBar({ canUndo, onSearch, onFoldAll, onUnfoldAll, onUndo, onMenu }: BarProps) {
  // caption = the visible word; label = the accessible name. Keep the caption a
  // prefix of the label so voice control ("tap Fold") still matches (WCAG 2.5.3).
  const buttons = [
    { id: 'search', icon: 'search', caption: 'Search', label: 'Search the text', onClick: onSearch },
    { id: 'foldall', icon: 'unfold_less', caption: 'Fold', label: 'Fold all', onClick: onFoldAll },
    {
      id: 'unfoldall',
      icon: 'unfold_more',
      caption: 'Unfold',
      label: 'Unfold all',
      onClick: onUnfoldAll,
    },
    { id: 'undo', icon: 'undo', caption: 'Undo', label: 'Undo', onClick: onUndo, disabled: !canUndo },
    { id: 'menu', icon: 'tune', caption: 'More', label: 'More controls', onClick: onMenu },
  ];
  return (
    <nav className="mobile-bar" aria-label="Controls">
      {buttons.map((b) => (
        <button
          key={b.id}
          type="button"
          className={`mobile-bar-btn${b.disabled ? ' is-disabled' : ''}`}
          aria-label={b.label}
          aria-disabled={b.disabled || undefined}
          onClick={() => {
            if (!b.disabled) b.onClick();
          }}
        >
          <span className="msym" aria-hidden="true">
            {b.icon}
          </span>
          <span className="mobile-bar-label" aria-hidden="true">
            {b.caption}
          </span>
        </button>
      ))}
    </nav>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileSheet({ open, onClose, children }: SheetProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  // The sheet had no focus management at all: Tab walked straight through it
  // into the page underneath, which is covered by the scrim and unreachable by
  // pointer. Escape is handled by App's escape(), which closes the sheet.
  useDialog(cardRef, open);

  if (!open) return null;
  return (
    <>
      <div className="mobile-scrim" onClick={onClose} />
      <div ref={cardRef} className="mobile-sheet" role="dialog" aria-modal="true" aria-label="Controls">
        <div className="mobile-sheet-grip" aria-hidden="true" />
        {children}
      </div>
    </>
  );
}
