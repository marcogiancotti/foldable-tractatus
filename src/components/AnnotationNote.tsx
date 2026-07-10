/*
  A private margin note (spec §6): rest / hover / editing, debounced autosave,
  2,000-char cap. Plain text only — always rendered as text content, line
  breaks preserved. Floats in the right rail ≥1180px, inline below the
  statement otherwise.
*/

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { NOTE_LIMIT } from '../state/store';

interface Props {
  n: string;
  indent: number; // the statement row's left padding, for inline alignment
  text: string;
  editing: boolean;
  marginMode: boolean;
  onStartEdit: () => void;
  onCommit: (text: string) => void;
  onStopEdit: () => void;
  onDelete: () => void; // the parent confirms before anything is removed
}

const AUTOSAVE_DEBOUNCE = 600;

export default function AnnotationNote({
  n,
  indent,
  text,
  editing,
  marginMode,
  onStartEdit,
  onCommit,
  onStopEdit,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState(text);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // (Re)enter editing: sync the draft and focus at the end of the text.
  useEffect(() => {
    if (!editing) return;
    setDraft(text);
    const el = areaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      grow(el);
    }
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, n]);

  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const handleChange = (value: string) => {
    const next = value.slice(0, NOTE_LIMIT);
    setDraft(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onCommit(next), AUTOSAVE_DEBOUNCE);
  };

  const handleBlur = () => {
    clearTimeout(timer.current);
    onCommit(draft);
    onStopEdit();
  };

  // Enter confirms and closes the editor; Shift+Enter inserts a newline (§6).
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const wrapStyle = marginMode
    ? undefined
    : { marginLeft: indent + 92, marginTop: -1, marginBottom: 8 };

  return (
    <div className={`note-wrap ${marginMode ? 'is-margin' : 'is-inline'}`} style={wrapStyle}>
      {editing ? (
        <div className="note-edit-box">
          <textarea
            ref={areaRef}
            className="note-input"
            value={draft}
            aria-label={`Annotation for statement ${n}`}
            onChange={(e) => {
              grow(e.target);
              handleChange(e.target.value);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <div className="note-edit-foot">
            <div className="note-meta">
              autosaved · {(NOTE_LIMIT - draft.length).toLocaleString()} left
            </div>
            <button
              type="button"
              className="note-trash msym"
              aria-label={`Delete note on statement ${n}`}
              title="delete note"
              // keep the textarea focused: blur would commit and close the
              // editor on mousedown, before this click ever landed
              onMouseDown={(e) => e.preventDefault()}
              onClick={onDelete}
            >
              delete
            </button>
          </div>
        </div>
      ) : (
        <div
          className="note-box"
          onClick={onStartEdit}
          role="button"
          tabIndex={0}
          aria-label={`Edit annotation for statement ${n}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onStartEdit();
            }
          }}
        >
          {/* Margin notes rest clamped to a few lines and never overlap (§6);
              each wears its statement number, and the "more" hint shows only
              when the clamp actually cuts text (.is-overflowing, set by the
              layout pass in ReadingColumn). */}
          <span className="note-main">
            {marginMode && (
              <span className="note-num" aria-hidden="true">
                {n}
              </span>
            )}
            <span className={`note-text${marginMode ? ' note-clamp' : ''}`}>{text}</span>
            {marginMode && (
              <span className="note-more" aria-hidden="true">
                ⌄ more
              </span>
            )}
          </span>
          <span className="note-pencil msym" aria-hidden="true">
            edit
          </span>
        </div>
      )}
    </div>
  );
}
