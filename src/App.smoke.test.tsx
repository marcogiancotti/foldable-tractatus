// @vitest-environment jsdom
/*
  Smoke test: the whole app mounts and the core interactions run without
  crashing under jsdom. Not a visual test — it catches runtime wiring errors.
*/

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

beforeAll(() => {
  // jsdom lacks matchMedia/scrollTo; the app only needs their shape.
  window.matchMedia ??= ((query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  history.replaceState(null, '', '/');
  localStorage.clear();
  container = document.createElement('div');
  document.body.appendChild(container);
  const { default: App } = await import('./App');
  root = createRoot(container);
  await act(async () => root.render(<App />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

const click = (el: Element | null) => {
  expect(el).not.toBeNull();
  return act(async () =>
    el!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })),
  );
};

describe('app smoke', () => {
  it('mounts with the seven roots only', () => {
    expect(container.textContent).toContain('The Foldable');
    expect(container.querySelectorAll('[data-n]')).toHaveLength(7);
    expect(container.textContent).toContain('Whereof one cannot speak');
  });

  it('unfolds a branch, pins a statement, derives the focused view, undoes', async () => {
    // unfold 2, then 2.1
    await click(container.querySelector('[data-n="2"] .row-toggle'));
    expect(container.querySelector('[data-n="2.1"]')).not.toBeNull();
    await click(container.querySelector('[data-n="2.1"] .row-toggle'));
    // pin 2.11, then fold all → focused view with peek ranges
    await click(container.querySelector('[data-n="2.11"] .row-pin'));
    await click(container.querySelector('[aria-label="fold all"]'));
    expect(container.querySelector('[data-n="2.11"]')).not.toBeNull();
    expect(container.textContent).toContain('2.12–2.14');
    expect(container.querySelector('[data-n="2.141"]')).toBeNull();
    // the URL carries the pin
    expect(location.search).toContain('p=2.11');
    // undo everything back to bare roots
    const undoBtn = container.querySelector('[aria-label="undo"]');
    for (let i = 0; i < 4; i++) await click(undoBtn);
    expect(container.querySelectorAll('[data-n]')).toHaveLength(7);
    expect(location.search).toBe('');
  });

  it('activates a term from an inline mark and shows the term card', async () => {
    await click(container.querySelector('.idx-term'));
    expect(container.textContent).toContain('Selected:');
    expect(container.querySelector('.term-card')).not.toBeNull();
    // occurrence badges appear on collapsed rows
    expect(container.querySelector('.row-badge, .peek-badge')).not.toBeNull();
  });

  it('opens the reader guide from the toolbar and closes it with the scrim', async () => {
    await click(container.querySelector('[aria-label="shortcuts"]'));
    expect(document.body.textContent).toContain('Reader guide');
  });
});
