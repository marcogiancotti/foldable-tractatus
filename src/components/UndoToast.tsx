import { useEffect, useRef, useState } from 'react';

export interface ToastData {
  id: number; // changes for each raise; restart timers when it changes
  message: string;
  undoable: boolean; // true = undo variant, false = plain copy/info toast
}

interface UndoToastProps {
  toast: ToastData | null;
  onUndo: () => void; // reader clicked Undo
  onDismiss: () => void; // timeout elapsed (also call after onUndo)
}

const DWELL_UNDOABLE = 6000;
const DWELL_PLAIN = 4200;

export default function UndoToast({ toast, onUndo, onDismiss }: UndoToastProps) {
  const [barRun, setBarRun] = useState(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  // Restart the dwell timer (and, for the undoable variant, the countdown-bar
  // animation) whenever a *new* toast is raised — keyed on toast.id, not on
  // object identity, so re-renders with the same toast don't reset the clock.
  useEffect(() => {
    if (!toast) return;
    setBarRun(false);
    const dwell = toast.undoable ? DWELL_UNDOABLE : DWELL_PLAIN;

    let raf1 = 0;
    let raf2 = 0;
    if (toast.undoable) {
      // Double rAF so the transition actually animates from the scaleX(1)
      // starting frame instead of jumping straight to scaleX(0).
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setBarRun(true));
      });
    }

    const timer = setTimeout(() => onDismissRef.current(), dwell);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [toast?.id, toast?.undoable]);

  if (!toast) return null;

  const dwell = toast.undoable ? DWELL_UNDOABLE : DWELL_PLAIN;

  const handleUndo = () => {
    onUndo();
    onDismiss();
  };

  return (
    <div className="toast-wrap" role="status" aria-live="polite">
      <div className="toast-card">
        <span className="toast-msg">{toast.message}</span>
        {toast.undoable && (
          <button type="button" className="toast-undo" onClick={handleUndo}>
            Undo
          </button>
        )}
        {toast.undoable && (
          <span
            className="toast-bar"
            style={{
              transform: barRun ? 'scaleX(0)' : 'scaleX(1)',
              transition: barRun ? `transform ${dwell}ms linear` : 'none',
            }}
          />
        )}
      </div>
    </div>
  );
}
