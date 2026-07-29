/*
  "Back to N" affordance shown after a cross-reference jump (spec §11/§12).
  A cross-ref jump deliberately stays off both the undo stack and the browser
  history, so neither Undo nor the browser Back button returns the reader — this
  pill is the return path. It carries only the origin statement number; App owns
  the scroll-back. Auto-dismisses after a dwell, or on the next forward jump.
*/

import { useEffect, useRef, useState } from 'react';

interface Props {
  target: string | null; // origin statement to return to; null = hidden
  onReturn: () => void;
  onDismiss: () => void;
}

const DWELL = 8000;

export default function ReturnPill({ target, onReturn, onDismiss }: Props) {
  // As with the toast: the pill holds the only way back, so hovering or
  // focusing it stops the clock (WCAG 2.2.1).
  const [held, setHeld] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!target || held) return;
    const timer = setTimeout(() => onDismissRef.current(), DWELL);
    return () => clearTimeout(timer);
  }, [target, held]);

  // The live region stays mounted so the announcement is not lost to a region
  // that appears already-populated (4.1.3).
  return (
    <div
      className="return-wrap"
      role="status"
      aria-live="polite"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocusCapture={() => setHeld(true)}
      onBlurCapture={() => setHeld(false)}
    >
      {target && (
        <button type="button" className="return-pill" onClick={onReturn}>
          <span className="msym return-arrow" aria-hidden="true">
            arrow_back
          </span>
          Back to {target}
        </button>
      )}
    </div>
  );
}
