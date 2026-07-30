/*
  Milestone tracking, driven by state rather than sprinkled through handlers.

  The discrete one-shot actions (share, export, apply a path) call `track`
  directly at their handler in `App.tsx` — there is nothing to derive. But the
  questions that actually say whether the app *works* — did this reader ever
  pin anything, ever write a note, ever get below the third decimal — are
  properties of the state, so they are watched here in one place instead of
  being guessed at from a dozen call sites.

  Every event fires at most once per page load (see `trackOnce`).
*/

import { useEffect } from 'react';
import { curatedTermFor } from '../data/terms';
import type { DisplayItem } from '../model/focusedView';
import {
  DEPTH_MILESTONES,
  NOTE_MILESTONES,
  PIN_MILESTONES,
  arrivalKind,
  initAnalytics,
  milestoneReached,
  termLabel,
  track,
  trackOnce,
} from './analytics';

/** How long a search box must sit still before the term counts as "traced". */
const TERM_SETTLE_MS = 1200;

export interface AnalyticsSnapshot {
  pinCount: number;
  noteCount: number;
  display: DisplayItem[];
  activeTerm: string | null;
}

export function useAnalytics({ pinCount, noteCount, display, activeTerm }: AnalyticsSnapshot) {
  // One pageview per load (the script sends it); the arrival event tells the
  // pageview apart from a link someone was sent. The app only ever calls
  // replaceState, so no navigation event follows.
  useEffect(() => {
    initAnalytics();
    track('Arrived', { via: arrivalKind(location.search) });
  }, []);

  useEffect(() => {
    const hit = milestoneReached(pinCount, PIN_MILESTONES);
    if (hit) trackOnce(`pins:${hit}`, 'Pinned', { count: String(hit) });
  }, [pinCount]);

  useEffect(() => {
    const hit = milestoneReached(noteCount, NOTE_MILESTONES);
    if (hit) trackOnce(`notes:${hit}`, 'Annotated', { count: String(hit) });
  }, [noteCount]);

  // How far into the decimal tree the reader has actually opened things up.
  // Peek ranges don't count: they appear without anyone asking for them.
  useEffect(() => {
    let deepest = 0;
    for (const item of display) {
      if (item.kind === 'row' && item.depth > deepest) deepest = item.depth;
    }
    const hit = milestoneReached(deepest, DEPTH_MILESTONES);
    if (hit) trackOnce(`depth:${hit}`, 'Read deep', { depth: String(hit) });
  }, [display]);

  // Debounced: a search box emits a term per keystroke, and only the one the
  // reader stopped on is a trace. Curated terms are named, typed text is not.
  useEffect(() => {
    if (!activeTerm) return;
    const timer = setTimeout(() => {
      const label = termLabel(activeTerm, Boolean(curatedTermFor(activeTerm)));
      trackOnce(`term:${label}`, 'Traced term', { term: label });
    }, TERM_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [activeTerm]);
}
