/*
  Cross-reference preview (design/handoff/components/cross-reference-preview.md).
  The interactive unit is `RefLink`: a single clickable statement number that
  opens a small anchored popover with the target statement's text and a "Go to
  statement N" link. It is used two ways:
    1. inline in prose — the number Wittgenstein actually wrote (e.g. "No. 5.101")
       is made clickable in place (see StatementText); nothing is added to the text.
    2. as a "(cf. N)" fallback (the default export) for any ref that, unusually,
       is NOT written inline in the statement's prose.
*/

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { statement } from '../model/tree';
import MathText from './MathText';

interface RefLinkProps {
  target: string;
  onNavigate: (n: string) => void;
  hit?: boolean;
}

const POP_WIDTH = 304;
const GAP = 9;
const MARGIN = 12;

export function RefLink({ target, onNavigate, hit = false }: RefLinkProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const popId = useId();
  // The popover is portalled to <body>: it carries block content (paragraphs,
  // even a table in the 5.101 preview), which is illegal inside the prose <p>
  // this link lives in. `anchor` non-null means open; `coords` is the resolved
  // fixed position (flips above the number when there's no room below).
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const open = anchor !== null;

  useLayoutEffect(() => {
    if (!anchor) {
      setCoords(null);
      return;
    }
    const h = popRef.current?.offsetHeight ?? 0;
    const left = Math.max(MARGIN, Math.min(anchor.left, window.innerWidth - POP_WIDTH - MARGIN));
    let top = anchor.bottom + GAP;
    // Flip above the number if it would overflow the bottom and there's room up top.
    if (top + h > window.innerHeight - MARGIN && anchor.top - h - GAP > MARGIN) {
      top = anchor.top - h - GAP;
    }
    top = Math.max(MARGIN, Math.min(top, window.innerHeight - h - MARGIN));
    setCoords({ top, left });
  }, [anchor]);

  useEffect(() => {
    if (!open) return;
    function isInside(t: EventTarget | null) {
      const el = t as HTMLElement | null;
      return !!el?.closest?.('.xref-pop, .xref-num');
    }
    function onPointerDown(e: PointerEvent) {
      if (!isInside(e.target)) setAnchor(null);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setAnchor(null);
    }
    // The popover is fixed-positioned, so close it if the page scrolls out
    // from under it rather than let it drift — unless the reader is inside it,
    // which is what happens when they Tab toward "Go to statement N" and the
    // browser scrolls the focused control into view.
    function onScroll() {
      if (popRef.current?.contains(document.activeElement)) return;
      setAnchor(null);
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  let node;
  try {
    node = statement(target);
  } catch {
    return <>{target}</>; // unknown ref id — leave the number as plain text
  }

  return (
    <span className="xref-wrap xref-inline">
      <button
        ref={btnRef}
        type="button"
        className={`xref-num${open ? ' is-open' : ''}${hit ? ' term-hit' : ''}`}
        // A disclosure, not a dialog: focus is never moved into the popover, so
        // claiming role="dialog" promised a modal contract nothing implemented.
        aria-expanded={open}
        aria-controls={open ? popId : undefined}
        aria-label={`preview statement ${target}`}
        title={`preview ${target}`}
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(open ? null : btnRef.current!.getBoundingClientRect());
        }}
      >
        {target}
      </button>
      {open &&
        createPortal(
          <div
            ref={popRef}
            id={popId}
            className="xref-pop xref-pop-fixed"
            aria-label={`Preview of statement ${target}`}
            style={{
              top: coords?.top ?? anchor.bottom + GAP,
              left: coords?.left ?? anchor.left,
              width: POP_WIDTH,
              visibility: coords ? 'visible' : 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="xref-pop-num">{node.n}</div>
            <div className="xref-pop-text">
              <MathText text={node.text} />
            </div>
            <div className="xref-pop-sep" />
            <button
              type="button"
              className="xref-pop-link"
              onClick={() => {
                setAnchor(null);
                onNavigate(target);
              }}
            >
              Go to statement {target}
              <span className="msym xref-pop-arrow" aria-hidden="true">
                arrow_forward
              </span>
            </button>
          </div>,
          document.body,
        )}
    </span>
  );
}

interface XRefsProps {
  refs: string[];
  onNavigate: (n: string) => void;
}

// Fallback rendering for refs not written inline: "(cf. N)".
export default function XRefPreview({ refs, onNavigate }: XRefsProps) {
  if (refs.length === 0) return null;
  return (
    <>
      {refs.map((target, i) => (
        <span key={`${target}-${i}`} className="xref-wrap">
          <span className="xref-quiet">{' (cf. '}</span>
          <RefLink target={target} onNavigate={onNavigate} />
          <span className="xref-quiet">)</span>
        </span>
      ))}
    </>
  );
}
