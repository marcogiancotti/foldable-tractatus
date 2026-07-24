/*
  "Back to N" affordance shown after a cross-reference jump (spec §11/§12).
  A cross-ref jump deliberately stays off both the undo stack and the browser
  history, so neither Undo nor the browser Back button returns the reader — this
  pill is the return path. It carries only the origin statement number; App owns
  the scroll-back. Auto-dismisses after a dwell, or on the next forward jump.
*/

import { useEffect, useRef } from 'react';

interface Props {
  target: string | null; // origin statement to return to; null = hidden
  onReturn: () => void;
  onDismiss: () => void;
}

const DWELL = 8000;

export default function ReturnPill({ target, onReturn, onDismiss }: Props) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (!target) return;
    const timer = setTimeout(() => onDismissRef.current(), DWELL);
    return () => clearTimeout(timer);
  }, [target]);

  if (!target) return null;

  return (
    <div className="return-wrap" role="status" aria-live="polite">
      <button type="button" className="return-pill" onClick={onReturn}>
        <span className="msym return-arrow" aria-hidden="true">
          arrow_back
        </span>
        Back to {target}
      </button>
    </div>
  );
}
