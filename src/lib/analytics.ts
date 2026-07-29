/*
  Optional, self-hosted Plausible analytics.

  OFF unless BOTH `VITE_PLAUSIBLE_DOMAIN` and `VITE_PLAUSIBLE_SRC` are set at
  build time — so a fork, a local dev build, and the test suite all measure
  nothing at all. See `docs/analytics.md` for the event catalogue and the
  reasoning behind what is and is not collected.

  Two rules constrain everything in this file, and they are not negotiable:

  1. **Nothing a reader wrote ever leaves the browser.** Annotations are out of
     scope entirely; free-text search is reported as the constant
     `(free search)` rather than as what was typed. Only the curated term index
     — a fixed, published list — is ever named.
  2. **Every property is a bounded, low-cardinality label.** Counts become
     buckets, depths become buckets. No statement text, no note text, no ids
     beyond the curated path/term vocabulary.

  Plausible is cookieless and stores no per-visitor identifier, so there is no
  consent banner to add; `RESPECT_DNT` additionally drops the whole script for
  readers who ask not to be tracked.
*/

const DOMAIN = ((import.meta.env.VITE_PLAUSIBLE_DOMAIN as string | undefined) ?? '').trim();
const SRC = ((import.meta.env.VITE_PLAUSIBLE_SRC as string | undefined) ?? '').trim();
/*
  Optional `data-api` override. Only needed behind a first-party proxy served
  from a non-standard path, where the script cannot infer its own event endpoint
  (see DEPLOY.md § Analytics).
*/
const API = ((import.meta.env.VITE_PLAUSIBLE_API as string | undefined) ?? '').trim();

/*
  Honour Do-Not-Track / Global Privacy Control. Plausible's own script does not
  (it has no visitor identity to protect), but this app promises readers that it
  keeps out of their way, and the cost is a few percent of sessions. Flip to
  `false` to count those readers too.
*/
const RESPECT_DNT = true;

export type EventProps = Record<string, string | number | boolean>;

interface PlausibleFn {
  (event: string, options?: { props?: EventProps; callback?: () => void }): void;
  q?: unknown[];
}

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

function trackingRefused(): boolean {
  if (!RESPECT_DNT || typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { msDoNotTrack?: string; globalPrivacyControl?: boolean };
  return nav.doNotTrack === '1' || nav.msDoNotTrack === '1' || nav.globalPrivacyControl === true;
}

/** Whether this build sends anything anywhere. False unless both vars are set. */
export function analyticsEnabled(): boolean {
  return Boolean(DOMAIN && SRC) && typeof window !== 'undefined' && !trackingRefused();
}

let started = false;

/**
 * Inject the Plausible script once. Safe to call repeatedly and safe to call
 * before the script has loaded — `track` queues events until it does.
 */
export function initAnalytics(): void {
  if (started || !analyticsEnabled()) return;
  started = true;

  // The queue stub Plausible documents: events fired before the script lands
  // are replayed once it does, so no early milestone is lost.
  if (!window.plausible) {
    const queued: PlausibleFn = function (...args: unknown[]) {
      (queued.q = queued.q || []).push(args);
    } as unknown as PlausibleFn;
    window.plausible = queued;
  }

  const el = document.createElement('script');
  el.defer = true;
  el.dataset.domain = DOMAIN;
  if (API) el.dataset.api = API;
  el.src = SRC;
  document.head.appendChild(el);
}

/** Send one custom event. A no-op in any build without analytics configured. */
export function track(event: string, props?: EventProps): void {
  if (!analyticsEnabled()) return;
  window.plausible?.(event, props ? { props } : undefined);
}

/*
  Session-scoped de-duplication. Milestones ("first pin", "reached depth 4")
  answer *how many readers ever got here*, not *how often* — so each one is
  reported at most once per page load. The set lives in module scope and dies
  with the tab; nothing is persisted.
*/
const fired = new Set<string>();

export function trackOnce(key: string, event: string, props?: EventProps): void {
  if (fired.has(key)) return;
  fired.add(key);
  track(event, props);
}

/** Test seam: forget which milestones have fired. */
export function resetTrackedMilestones(): void {
  fired.clear();
}

// ---------------------------------------------------------------------------
// Pure label derivation — everything below is a total function over its input,
// which is what keeps the "bounded, low-cardinality" rule checkable in tests.
// ---------------------------------------------------------------------------

export type Arrival = 'shared-view' | 'statement-link' | 'notes-link' | 'direct';

/**
 * How this reader got here, from the query string alone. Distinguishes the
 * plain landing page from the three kinds of link readers send each other —
 * the only way to see whether sharing actually brings anyone back.
 */
export function arrivalKind(search: string): Arrival {
  const q = new URLSearchParams(search);
  if (q.has('bundle')) return 'notes-link';
  if (q.has('statement')) return 'statement-link';
  if (q.has('p') || q.has('e') || q.has('t') || q.has('path')) return 'shared-view';
  return 'direct';
}

/** Milestone thresholds, reported as labels so the Plausible property is bounded. */
export const PIN_MILESTONES = [1, 3, 10] as const;
export const NOTE_MILESTONES = [1, 3] as const;
export const DEPTH_MILESTONES = [3, 4, 5] as const;

/** The highest milestone in `steps` that `value` has reached, or null. */
export function milestoneReached(value: number, steps: readonly number[]): number | null {
  let hit: number | null = null;
  for (const step of steps) if (value >= step) hit = step;
  return hit;
}

/**
 * The label for a traced term. Curated terms are a fixed published vocabulary
 * and safe to name; anything the reader typed themselves is not, and collapses
 * to a single constant.
 */
export const FREE_SEARCH = '(free search)';

export function termLabel(term: string, isCurated: boolean): string {
  return isCurated ? term.toLowerCase() : FREE_SEARCH;
}
