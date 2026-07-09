/*
  Cross-reference preview (design/handoff/components/cross-reference-preview.md):
  inline "(cf. N)" tokens at the end of a statement's text. The number is the
  interactive part — clicking it toggles a small anchored popover with the
  target statement's text and a "Go to statement N" link. Only one popover is
  open at a time within this component instance.
*/

import { useEffect, useState } from 'react';
import { statement } from '../model/tree';

interface XRefsProps {
  refs: string[];
  onNavigate: (n: string) => void;
}

export default function XRefPreview({ refs, onNavigate }: XRefsProps) {
  const [openRef, setOpenRef] = useState<string | null>(null);

  useEffect(() => {
    if (!openRef) return;
    function isInside(target: EventTarget | null) {
      const el = target as HTMLElement | null;
      return !!el?.closest?.('.xref-pop, .xref-num');
    }
    function onPointerDown(e: PointerEvent) {
      if (!isInside(e.target)) setOpenRef(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenRef(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openRef]);

  if (refs.length === 0) return null;

  return (
    <>
      {refs.map((target, i) => {
        let node;
        try {
          node = statement(target);
        } catch {
          return null; // unknown ref id — skip rather than crash the row
        }
        const open = openRef === target;

        return (
          <span key={`${target}-${i}`} className="xref-wrap">
            <span className="xref-quiet">{' (cf. '}</span>
            <button
              type="button"
              className={`xref-num${open ? ' is-open' : ''}`}
              aria-expanded={open}
              aria-label={`preview statement ${target}`}
              title={`preview ${target}`}
              onClick={(e) => {
                e.stopPropagation();
                setOpenRef(open ? null : target);
              }}
            >
              {target}
            </button>
            <span className="xref-quiet">)</span>
            {open && (
              <div
                className="xref-pop"
                role="dialog"
                aria-label={`Preview of statement ${target}`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="xref-pop-num">{node.n}</div>
                <div className="xref-pop-text">{node.text}</div>
                <div className="xref-pop-sep" />
                <button
                  type="button"
                  className="xref-pop-link"
                  onClick={() => {
                    setOpenRef(null);
                    onNavigate(target);
                  }}
                >
                  Go to statement {target}
                  <span className="msym xref-pop-arrow" aria-hidden="true">
                    arrow_forward
                  </span>
                </button>
              </div>
            )}
          </span>
        );
      })}
    </>
  );
}
