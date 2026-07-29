// @vitest-environment jsdom
/*
  The configured path. `analytics.test.ts` covers the default — off, silent — but
  the branch that can silently rot is the one that only runs in production, so
  it gets exercised here with the env vars stubbed and the module re-imported
  (the config is read once at module load, by design).
*/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const HOST = 'https://plausible.example.com/js/script.js';

async function loadConfigured(extra: Record<string, string> = {}) {
  vi.stubEnv('VITE_PLAUSIBLE_DOMAIN', 'example.com');
  vi.stubEnv('VITE_PLAUSIBLE_SRC', HOST);
  for (const [k, v] of Object.entries(extra)) vi.stubEnv(k, v);
  vi.resetModules();
  return import('./analytics');
}

beforeEach(() => {
  document.head.innerHTML = '';
  delete (window as { plausible?: unknown }).plausible;
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('a configured build', () => {
  it('injects one deferred script carrying the site name', async () => {
    const a = await loadConfigured();
    expect(a.analyticsEnabled()).toBe(true);

    a.initAnalytics();
    a.initAnalytics(); // idempotent — repeated calls must not double-count

    const tags = [...document.head.querySelectorAll('script')];
    expect(tags).toHaveLength(1);
    expect(tags[0].src).toBe(HOST);
    expect(tags[0].defer).toBe(true);
    expect(tags[0].dataset.domain).toBe('example.com');
    expect(tags[0].dataset.api).toBeUndefined();
  });

  it('sets data-api only when a proxied endpoint is configured', async () => {
    const a = await loadConfigured({ VITE_PLAUSIBLE_API: '/stats/api/event' });
    a.initAnalytics();
    expect(document.head.querySelector('script')?.dataset.api).toBe('/stats/api/event');
  });

  // Milestones can fire before the deferred script has loaded; without the
  // queue stub those early events would be dropped on the floor.
  it('queues events fired before the script lands', async () => {
    const a = await loadConfigured();
    a.initAnalytics();
    a.track('Arrived', { via: 'direct' });
    expect(window.plausible?.q).toEqual([['Arrived', { props: { via: 'direct' } }]]);
  });

  it('sends each milestone at most once', async () => {
    const a = await loadConfigured();
    const spy = vi.fn();
    window.plausible = spy as unknown as typeof window.plausible;

    a.trackOnce('pins:1', 'Pinned', { count: '1' });
    a.trackOnce('pins:1', 'Pinned', { count: '1' });
    a.trackOnce('pins:3', 'Pinned', { count: '3' });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy).toHaveBeenCalledWith('Pinned', { props: { count: '1' } });
  });

  // jsdom's navigator has neither property, which is also the common real case.
  it('stays off for a reader sending Do-Not-Track', async () => {
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    const a = await loadConfigured();
    expect(a.analyticsEnabled()).toBe(false);

    const spy = vi.fn();
    window.plausible = spy as unknown as typeof window.plausible;
    a.initAnalytics();
    a.track('Arrived', { via: 'direct' });
    expect(document.head.querySelector('script')).toBe(null);
    expect(spy).not.toHaveBeenCalled();
    Reflect.deleteProperty(navigator, 'doNotTrack');
  });

  it('stays off for a reader sending Global Privacy Control', async () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      value: true,
      configurable: true,
    });
    const a = await loadConfigured();
    expect(a.analyticsEnabled()).toBe(false);
    Reflect.deleteProperty(navigator, 'globalPrivacyControl');
  });
});
