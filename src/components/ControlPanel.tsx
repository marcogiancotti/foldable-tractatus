import { useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import ThreadsMenu from './ThreadsMenu';

export interface ThreadInfo {
  id: string;
  name: string;
  pins: string[];
}

interface ControlPanelProps {
  canUndo: boolean;
  canRedo: boolean;
  onFoldAll: () => void;
  onUnfoldAll: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onHelp: () => void;
  onShare: () => void;
  onExportMarkdown: () => void;
  onExportPdf: () => void;
  presets: ThreadInfo[];
  threads: ThreadInfo[];
  maxThreads: number; // 5
  onApplyPreset: (id: string) => void;
  onApplyThread: (id: string) => void;
  onSaveThread: (name: string) => void; // save current pins as new thread
  onRenameThread: (id: string, name: string) => void;
  onOverwriteThread: (id: string) => void; // overwrite with current pins
  onDeleteThread: (id: string) => void;
  pinCount: number; // current number of pins
  // search line (the term card itself is a separate component, not this one):
  searchValue: string;
  onSearchChange: (value: string) => void;
  onClearTerm: () => void;
  termActive: boolean;
  termCount: number; // total occurrences, shown when termActive
  searchRef?: Ref<HTMLInputElement>;
  /** notified when the panel collapses/opens (the term card matches its width) */
  onOpenChange?: (open: boolean) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

interface ToolSpec {
  id: string;
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function ControlPanel({
  canUndo,
  canRedo,
  onFoldAll,
  onUnfoldAll,
  onUndo,
  onRedo,
  onHelp,
  onShare,
  onExportMarkdown,
  onExportPdf,
  presets,
  threads,
  maxThreads,
  onApplyPreset,
  onApplyThread,
  onSaveThread,
  onRenameThread,
  onOverwriteThread,
  onDeleteThread,
  pinCount,
  searchValue,
  onSearchChange,
  onClearTerm,
  termActive,
  termCount,
  searchRef,
  onOpenChange,
  theme,
  onToggleTheme,
}: ControlPanelProps) {
  const [open, setOpen] = useState(true);
  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    onOpenChange?.(next);
  };
  const [searchFocused, setSearchFocused] = useState(false);
  const [threadsOpen, setThreadsOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const exportWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (exportWrapRef.current && !exportWrapRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setExportOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [exportOpen]);

  const tools: ToolSpec[] = [
    { id: 'help', icon: 'help', label: 'shortcuts', onClick: onHelp },
    { id: 'foldall', icon: 'unfold_less', label: 'fold all', onClick: onFoldAll },
    { id: 'unfoldall', icon: 'unfold_more', label: 'unfold all', onClick: onUnfoldAll },
    { id: 'undo', icon: 'undo', label: 'undo', onClick: onUndo, disabled: !canUndo },
    { id: 'redo', icon: 'redo', label: 'redo', onClick: onRedo, disabled: !canRedo },
  ];

  const searchActive = searchFocused || termActive;
  const showKbdHint = !termActive && !searchFocused;
  const elevated = threadsOpen || exportOpen;

  return (
    <div className={`cp-panel${open ? ' is-open' : ''}${elevated ? ' is-elevated' : ''}`}>
      <div
        className={`cp-head${open ? ' is-open' : ''}`}
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={open ? 'Collapse panel' : 'Show controls'}
        title={open ? 'collapse panel' : 'show controls'}
        onClick={toggleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <span className="cp-title">Controls</span>
        <span className="cp-chev msym" aria-hidden="true">
          {open ? 'chevron_left' : 'chevron_right'}
        </span>
      </div>

      <div className="cp-body" style={{ display: open ? 'flex' : 'none' }}>
        <div className={`cp-search-line${searchActive ? ' is-active' : ''}`}>
          <span className="cp-search-icon msym" aria-hidden="true">
            search
          </span>
          <input
            ref={searchRef}
            className="cp-search-input"
            type="text"
            value={searchValue}
            placeholder="Search the text"
            aria-label="Search the text"
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {showKbdHint && (
            <span className="cp-search-kbd" aria-hidden="true">
              /
            </span>
          )}
          {termActive && (
            <>
              <span className="cp-search-count">{termCount}</span>
              <button
                type="button"
                className="cp-search-close msym"
                aria-label="Clear active term"
                title="clear"
                onClick={onClearTerm}
              >
                close
              </button>
            </>
          )}
        </div>

        <div className="cp-toolbar" role="toolbar" aria-label="Controls">
          {tools.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`cp-tool${t.disabled ? ' is-disabled' : ''}`}
              aria-label={t.label}
              aria-disabled={t.disabled || undefined}
              onClick={() => {
                if (!t.disabled) t.onClick();
              }}
            >
              <span className="cp-tool-icon msym" aria-hidden="true">
                {t.icon}
              </span>
              <span className="cp-tool-chip" aria-hidden="true">
                {t.label}
              </span>
            </button>
          ))}
        </div>

        <ThreadsMenu
          open={threadsOpen}
          onOpenChange={setThreadsOpen}
          presets={presets}
          threads={threads}
          maxThreads={maxThreads}
          pinCount={pinCount}
          onApplyPreset={onApplyPreset}
          onApplyThread={onApplyThread}
          onSaveThread={onSaveThread}
          onRenameThread={onRenameThread}
          onOverwriteThread={onOverwriteThread}
          onDeleteThread={onDeleteThread}
        />

        <div className="cp-more-group">
          <button
            type="button"
            className="cp-more-trigger"
            aria-expanded={moreOpen}
            aria-label="More"
            title="more"
            onClick={() => setMoreOpen((v) => !v)}
          >
            <span className={`cp-more-caret msym${moreOpen ? ' is-open' : ''}`} aria-hidden="true">
              chevron_right
            </span>
            <span className="cp-more-label">More</span>
          </button>

          {moreOpen && (
            <div className="cp-more-body">
              <button
                type="button"
                className="cp-share-row"
                title="copy a link to this view"
                onClick={onShare}
              >
                <span className="cp-share-icon msym" aria-hidden="true">
                  link
                </span>
                <span className="cp-share-label">Share</span>
              </button>

              <button
                type="button"
                className="cp-share-row"
                title="switch theme"
                onClick={onToggleTheme}
              >
                <span className="cp-share-icon msym" aria-hidden="true">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
                <span className="cp-share-label">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
              </button>

              <div className="cp-export-wrap" ref={exportWrapRef}>
                <button
                  type="button"
                  className="cp-export-row"
                  title="export pins & notes"
                  aria-expanded={exportOpen}
                  aria-haspopup="menu"
                  onClick={() => setExportOpen((v) => !v)}
                >
                  <span className="cp-export-icon msym" aria-hidden="true">
                    file_download
                  </span>
                  <span className="cp-export-label">Export</span>
                  <span className={`cp-export-caret msym${exportOpen ? ' is-open' : ''}`} aria-hidden="true">
                    expand_more
                  </span>
                </button>

                {exportOpen && (
                  <div className="cp-export-menu" role="menu">
                    <button
                      type="button"
                      className="cp-export-item"
                      role="menuitem"
                      onClick={() => {
                        onExportMarkdown();
                        setExportOpen(false);
                      }}
                    >
                      Export as Markdown
                    </button>
                    <button
                      type="button"
                      className="cp-export-item"
                      role="menuitem"
                      onClick={() => {
                        onExportPdf();
                        setExportOpen(false);
                      }}
                    >
                      Export as PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
