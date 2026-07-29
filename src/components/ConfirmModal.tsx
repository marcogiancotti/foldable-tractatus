import { useEffect, useRef } from 'react';
import { useDialog } from '../lib/useDialog';

export interface ConfirmRequest {
  title: string; // e.g. "Replace your current pins?"
  body: string; // pre-composed plain-text sentence(s)
  confirmLabel: string; // e.g. "Replace pins"
}

interface ConfirmModalProps {
  request: ConfirmRequest | null; // null = closed
  onConfirm: () => void;
  onCancel: () => void;
}

const TITLE_ID = 'confirm-modal-title';

export default function ConfirmModal({ request, onConfirm, onCancel }: ConfirmModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Traps Tab inside the card and hands focus back to the trigger on close.
  useDialog(cardRef, request !== null, confirmRef);

  useEffect(() => {
    if (!request) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [request, onCancel]);

  if (!request) return null;

  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div
        ref={cardRef}
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-title" id={TITLE_ID}>
          {request.title}
        </div>
        <div className="modal-body">{request.body}</div>
        <div className="modal-actions">
          <button ref={confirmRef} type="button" className="modal-confirm" onClick={onConfirm}>
            {request.confirmLabel}
          </button>
          <button type="button" className="modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
