/*
  Mobile chrome (≤719px): the side panel column disappears and its contents
  move into a bottom sheet, opened from a fixed bottom bar carrying the
  highest-frequency actions. Styles in mobile.css.
*/

import type { ReactNode } from 'react';

interface BarProps {
  canUndo: boolean;
  onSearch: () => void;
  onFoldAll: () => void;
  onUnfoldAll: () => void;
  onUndo: () => void;
  onMenu: () => void;
}

export function MobileBar({ canUndo, onSearch, onFoldAll, onUnfoldAll, onUndo, onMenu }: BarProps) {
  const buttons = [
    { id: 'search', icon: 'search', label: 'search the text', onClick: onSearch },
    { id: 'foldall', icon: 'unfold_less', label: 'fold all', onClick: onFoldAll },
    { id: 'unfoldall', icon: 'unfold_more', label: 'unfold all', onClick: onUnfoldAll },
    { id: 'undo', icon: 'undo', label: 'undo', onClick: onUndo, disabled: !canUndo },
    { id: 'menu', icon: 'tune', label: 'controls', onClick: onMenu },
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
  if (!open) return null;
  return (
    <>
      <div className="mobile-scrim" onClick={onClose} />
      <div className="mobile-sheet" role="dialog" aria-label="Controls">
        <div className="mobile-sheet-grip" aria-hidden="true" />
        {children}
      </div>
    </>
  );
}
