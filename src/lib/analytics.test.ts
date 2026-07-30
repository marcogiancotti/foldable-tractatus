/*
  The analytics module's contract, which is mostly a privacy contract: no build
  sends anything unless it is explicitly configured, and every property that
  does travel is a bounded label rather than something a reader wrote.
*/

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEPTH_MILESTONES,
  FREE_SEARCH,
  NOTE_MILESTONES,
  PIN_MILESTONES,
  analyticsEnabled,
  arrivalKind,
  initAnalytics,
  milestoneReached,
  resetTrackedMilestones,
  termLabel,
  track,
  trackOnce,
} from './analytics';

describe('the off switch', () => {
  beforeEach(() => resetTrackedMilestones());

  // The test run sets neither VITE_PLAUSIBLE_DOMAIN nor VITE_PLAUSIBLE_SRC,
  // which is the same state a fork or `npm run dev` is in.
  it('is off in an unconfigured build', () => {
    expect(analyticsEnabled()).toBe(false);
  });

  it('sends nothing and touches no global when off', () => {
    const spy = vi.fn();
    (globalThis as { window?: unknown }).window = { plausible: spy };
    track('Arrived', { via: 'direct' });
    trackOnce('pins:1', 'Pinned', { count: '1' });
    initAnalytics();
    expect(spy).not.toHaveBeenCalled();
    delete (globalThis as { window?: unknown }).window;
  });
});

describe('arrivalKind', () => {
  it('names the three kinds of shared link', () => {
    expect(arrivalKind('?bundle=abc')).toBe('notes-link');
    expect(arrivalKind('?statement=4.121')).toBe('statement-link');
    expect(arrivalKind('?p=2.1.4.01')).toBe('shared-view');
    expect(arrivalKind('?t=picture')).toBe('shared-view');
    expect(arrivalKind('?path=picture-theory')).toBe('shared-view');
  });

  it('falls back to direct, and never throws on junk', () => {
    expect(arrivalKind('')).toBe('direct');
    expect(arrivalKind('?')).toBe('direct');
    expect(arrivalKind('?theme=dark')).toBe('direct');
    expect(arrivalKind('?%%%&=&')).toBe('direct');
  });

  // A notes link also carries pins, so precedence has to be explicit or the
  // deepest kind of share would be reported as the shallowest.
  it('reports the most specific kind when a link carries several', () => {
    expect(arrivalKind('?p=2.1&bundle=abc')).toBe('notes-link');
    expect(arrivalKind('?p=2.1&statement=4.121')).toBe('statement-link');
  });
});

describe('milestoneReached', () => {
  it('reports the highest step reached, not every step', () => {
    expect(milestoneReached(0, PIN_MILESTONES)).toBe(null);
    expect(milestoneReached(1, PIN_MILESTONES)).toBe(1);
    expect(milestoneReached(2, PIN_MILESTONES)).toBe(1);
    expect(milestoneReached(3, PIN_MILESTONES)).toBe(3);
    expect(milestoneReached(9, PIN_MILESTONES)).toBe(3);
    expect(milestoneReached(500, PIN_MILESTONES)).toBe(10);
  });

  it('keeps every milestone label bounded', () => {
    for (const steps of [PIN_MILESTONES, NOTE_MILESTONES, DEPTH_MILESTONES]) {
      const labels = new Set<string>();
      for (let v = 0; v <= 600; v++) {
        const hit = milestoneReached(v, steps);
        if (hit !== null) labels.add(String(hit));
      }
      expect(labels.size).toBe(steps.length);
    }
  });
});

describe('termLabel', () => {
  it('names curated terms, which are a published vocabulary', () => {
    expect(termLabel('Sachverhalt', true)).toBe('sachverhalt');
  });

  // The whole point: free search can contain anything a reader types, so it
  // must collapse to one constant no matter what went in.
  it('never echoes free-text search back', () => {
    for (const typed of ['my thesis draft', 'jane@example.com', '<script>', '']) {
      expect(termLabel(typed, false)).toBe(FREE_SEARCH);
    }
  });
});
