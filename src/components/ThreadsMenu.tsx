import { useEffect, useRef, useState } from 'react';
import type { ThreadInfo } from './ControlPanel';

interface ThreadsMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: ThreadInfo[];
  threads: ThreadInfo[];
  maxThreads: number;
  pinCount: number;
  onApplyPreset: (id: string) => void;
  onApplyThread: (id: string) => void;
  onSaveThread: (name: string) => void;
  onRenameThread: (id: string, name: string) => void;
  onOverwriteThread: (id: string) => void;
  onDeleteThread: (id: string) => void;
}

export default function ThreadsMenu({
  open,
  onOpenChange,
  presets,
  threads,
  maxThreads,
  pinCount,
  onApplyPreset,
  onApplyThread,
  onSaveThread,
  onRenameThread,
  onOverwriteThread,
  onDeleteThread,
}: ThreadsMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [savingOpen, setSavingOpen] = useState(false);
  const [saveValue, setSaveValue] = useState('');

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setRenamingId(null);
      setSavingOpen(false);
      setSaveValue('');
    }
  }, [open]);

  const saveDisabled = threads.length >= maxThreads || pinCount === 0;
  const slotsLeft = Math.max(0, maxThreads - threads.length);

  function commitRename(id: string) {
    const name = renameValue.trim();
    if (name) onRenameThread(id, name);
    setRenamingId(null);
  }

  function commitSave() {
    const name = saveValue.trim();
    if (name) {
      onSaveThread(name);
      setSavingOpen(false);
      setSaveValue('');
      onOpenChange(false);
    }
  }

  /*
    This was role="menu" with role="menuitem" divs — invalid twice over: a
    menuitem must not contain independently focusable descendants (the thread
    rows each hold three action buttons), and none of the APG menu keyboard
    contract (arrow navigation, roving tabindex, typeahead) was implemented.

    It is a disclosure, not a menu, so it is now built from real buttons in a
    labelled group. aria-expanded on the trigger is the whole semantic, Enter and
    Space come free with <button>, and nothing has to fake keyboard support.
  */
  return (
    <div className="cp-threads-group" ref={rootRef}>
      <button
        type="button"
        className="cp-threads-trigger"
        aria-expanded={open}
        aria-label="Saved threads"
        title="saved threads"
        onClick={() => onOpenChange(!open)}
      >
        <span className="cp-threads-icon msym" aria-hidden="true">
          list_alt
        </span>
        <span className="cp-threads-label">Saved threads</span>
        <span className={`cp-threads-caret msym${open ? ' is-open' : ''}`} aria-hidden="true">
          expand_more
        </span>
      </button>

      {open && (
        <div className="cp-threads-menu" aria-label="Saved threads">
          <div className="cp-menu-sec">Presets</div>
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              className="cp-menu-row"
              onClick={() => {
                onApplyPreset(p.id);
                onOpenChange(false);
              }}
            >
              <span className="cp-menu-name">{p.name}</span>
              <span className="cp-menu-count">{p.pins.length} pins</span>
            </button>
          ))}

          <div className="cp-menu-sec">
            My threads{' '}
            <span className="cp-menu-sec-dim">
              {threads.length} of {maxThreads}
            </span>
          </div>
          {threads.map((t) =>
            renamingId === t.id ? (
              <div key={t.id} className="cp-menu-row cp-menu-row-input">
                <input
                  className="cp-inline-input"
                  autoFocus
                  value={renameValue}
                  aria-label={`Rename ${t.name}`}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation();
                      commitRename(t.id);
                    } else if (e.key === 'Escape') {
                      e.stopPropagation();
                      setRenamingId(null);
                    }
                  }}
                />
              </div>
            ) : (
              // A button cannot nest buttons, so the row splits: the apply
              // action is its own button, the three per-thread actions sit
              // beside it rather than inside it.
              <div key={t.id} className="cp-menu-row cp-menu-row-thread">
                <button
                  type="button"
                  className="cp-menu-main"
                  onClick={() => {
                    onApplyThread(t.id);
                    onOpenChange(false);
                  }}
                >
                  <span className="cp-menu-name">{t.name}</span>
                  <span className="cp-menu-count">{t.pins.length} pins</span>
                </button>
                <span className="cp-menu-actions">
                  <button
                    type="button"
                    className="cp-menu-act msym"
                    aria-label={`Rename ${t.name}`}
                    title="rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenamingId(t.id);
                      setRenameValue(t.name);
                    }}
                  >
                    edit
                  </button>
                  <button
                    type="button"
                    className="cp-menu-act msym"
                    aria-label={`Overwrite ${t.name} with current pins`}
                    title="overwrite with current pins"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOverwriteThread(t.id);
                      onOpenChange(false);
                    }}
                  >
                    save
                  </button>
                  <button
                    type="button"
                    className="cp-menu-act msym"
                    aria-label={`Delete ${t.name}`}
                    title="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteThread(t.id);
                    }}
                  >
                    close
                  </button>
                </span>
              </div>
            ),
          )}

          <div className="cp-menu-sep" />

          {savingOpen ? (
            <div className="cp-menu-row cp-menu-row-input">
              <span className="cp-save-icon msym" aria-hidden="true">
                add
              </span>
              <input
                className="cp-inline-input"
                autoFocus
                placeholder="Thread name"
                aria-label={`Save current ${pinCount} pins as`}
                value={saveValue}
                onChange={(e) => setSaveValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.stopPropagation();
                    commitSave();
                  } else if (e.key === 'Escape') {
                    e.stopPropagation();
                    setSavingOpen(false);
                    setSaveValue('');
                  }
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              className={`cp-save-row${saveDisabled ? ' is-disabled' : ''}`}
              disabled={saveDisabled}
              onClick={() => setSavingOpen(true)}
            >
              <span className="cp-save-icon msym" aria-hidden="true">
                add
              </span>
              <span className="cp-save-label">Save current pins…</span>
              <span className="cp-slots">{slotsLeft} left</span>
            </button>
          )}

          <div className="cp-menu-hint">
            Threads stay in this browser. To send the current view to someone, use Share under
            More.
          </div>
        </div>
      )}
    </div>
  );
}
