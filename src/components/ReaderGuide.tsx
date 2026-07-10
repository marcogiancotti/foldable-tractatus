import { useEffect, useRef } from 'react';

interface ReaderGuideProps {
  open: boolean;
  onClose: () => void;
}

interface IconLegendRow {
  icon: string;
  name: string;
  desc: string;
}

interface ShortcutRow {
  /** one array per alternate combo; each combo is an ordered list of keycaps */
  combos: string[][];
  /** text joining alternate combos — "or" for real alternates, "/" for the j/k companions */
  joiner: string;
  label: string;
}

interface ShortcutGroup {
  title: string;
  rows: ShortcutRow[];
}

// Verbatim from the prototype's helpIcons (Foldable Tractatus.dc.html ~L1348).
const ICON_LEGEND: IconLegendRow[] = [
  { icon: 'unfold_less', name: 'Fold all', desc: 'Collapse every branch back to the seven root propositions.' },
  { icon: 'unfold_more', name: 'Unfold all', desc: 'Expand the whole tree down to its leaves.' },
  { icon: 'undo', name: 'Undo', desc: 'Step back through fold, pin and annotation actions.' },
  { icon: 'redo', name: 'Redo', desc: 'Reapply an action you just undid.' },
];

// From the prototype's helpSpec (~L1315), with one intentional deviation: the
// Move group's prototype rows only list arrow keys, but spec §12 / the app's
// key handling also supports j/k, so we document them here as the app's
// source of truth even though the prototype's data object never gained them.
const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Move',
    rows: [
      { combos: [['↑'], ['k']], joiner: '/', label: 'Previous statement' },
      { combos: [['↓'], ['j']], joiner: '/', label: 'Next statement' },
    ],
  },
  {
    title: 'Fold',
    rows: [
      { combos: [['→']], joiner: 'or', label: 'Unfold one level' },
      { combos: [['←']], joiner: 'or', label: 'Fold statement' },
      { combos: [['⇧', '→']], joiner: 'or', label: 'Unfold all beneath' },
    ],
  },
  {
    title: 'Statement',
    rows: [
      { combos: [['P']], joiner: 'or', label: 'Pin or unpin' },
      { combos: [['Enter']], joiner: 'or', label: 'Add or edit annotation' },
    ],
  },
  {
    title: 'General',
    rows: [
      { combos: [['/']], joiner: 'or', label: 'Search the text (Enter/Esc leaves the box)' },
      { combos: [['Ctrl', 'Z'], ['⌘', 'Z']], joiner: 'or', label: 'Undo' },
      { combos: [['Ctrl', 'Y'], ['⌘', 'Y']], joiner: 'or', label: 'Redo' },
      { combos: [['Esc']], joiner: 'or', label: 'Clear selection or close' },
      { combos: [['?']], joiner: 'or', label: 'Show this list' },
    ],
  },
];

const TITLE_ID = 'reader-guide-title';

export default function ReaderGuide({ open, onClose }: ReaderGuideProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="guide-scrim" onClick={onClose}>
      <div
        className="guide-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="guide-head">
          <span className="guide-title" id={TITLE_ID}>
            Reader guide
          </span>
          <button
            ref={closeRef}
            type="button"
            className="guide-close"
            aria-label="Close"
            title="close"
            onClick={onClose}
          >
            <span className="msym" aria-hidden="true">
              close
            </span>
          </button>
        </div>

        <div className="guide-icons-group">
          <div className="guide-icons-title">The controls</div>
          {ICON_LEGEND.map((ic) => (
            <div className="guide-icon-row" key={ic.icon}>
              <span className="guide-icon-chip" aria-hidden="true">
                <span className="msym guide-icon-glyph">{ic.icon}</span>
              </span>
              <span className="guide-icon-text">
                <span className="guide-icon-name">{ic.name}</span>
                <div className="guide-icon-desc">{ic.desc}</div>
              </span>
            </div>
          ))}
        </div>

        <div className="guide-kbd-heading">Keyboard shortcuts</div>
        {SHORTCUT_GROUPS.map((g, gi) => (
          <div
            className="guide-group"
            key={g.title}
            style={gi === SHORTCUT_GROUPS.length - 1 ? { marginBottom: 0 } : undefined}
          >
            <div className="guide-group-title">{g.title}</div>
            {g.rows.map((r, ri) => (
              <div className="guide-row" key={ri}>
                <span className="guide-keys">
                  {r.combos.map((combo, ci) => (
                    <span className="guide-combo" key={ci}>
                      {ci > 0 && <span className="guide-or">{r.joiner}</span>}
                      {combo.map((k, ki) => (
                        <span className="guide-kbd" key={ki}>
                          {k}
                        </span>
                      ))}
                    </span>
                  ))}
                </span>
                <span className="guide-label">{r.label}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
