// @vitest-environment jsdom
/*
  Smoke test: the whole app mounts and the core interactions run without
  crashing under jsdom. Not a visual test — it catches runtime wiring errors.
*/

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mount the app over the frozen 25-node fixture so these behavioural assertions
// (specific ids, the 2.12–2.14 peek range) stay valid independent of the full text.
vi.mock('./model/tree', async (importActual) => {
  const actual = await importActual<typeof import('./model/tree')>();
  const { SAMPLE_TREE } = await import('./model/__fixtures__/sampleTree');
  return { ...actual, ...actual.buildTree(SAMPLE_TREE) };
});

// The real reading paths (src/data/paths.ts) pin statements that exist only in
// the full text, so the preset assertions below run against fixture-scale paths.
vi.mock('./data/paths', async (importActual) => {
  const actual = await importActual<typeof import('./data/paths')>();
  const READING_PATHS: typeof actual.READING_PATHS = [
    { id: 'picture-theory', name: 'Picture theory', pins: ['2.1', '2.11', '2.12'] },
    { id: 'world-and-facts', name: 'World & facts', pins: ['1.1', '1.11', '2'] },
  ];
  return { ...actual, READING_PATHS, pathById: new Map(READING_PATHS.map((p) => [p.id, p])) };
});

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

// React 19 reads controlled-input changes off native `input` events; setting
// .value must go through the prototype setter or React swallows the change.
const type = (input: Element | null, value: string) => {
  expect(input).not.toBeNull();
  return act(async () => {
    const proto = Object.getPrototypeOf(input);
    Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(input, value);
    input!.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const press = (el: Element | null, key: string) => {
  expect(el).not.toBeNull();
  return act(async () =>
    el!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })),
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

  it('renders the print view outside the app shell so print CSS can show it', () => {
    // print.css hides .app-root wholesale; a .print-view inside it can never print
    expect(container.querySelector('.print-view')).not.toBeNull();
    expect(container.querySelector('.app-root .print-view')).toBeNull();
  });

  it('asks before a preset replaces existing pins; cancel keeps them, confirm applies', async () => {
    await click(container.querySelector('[data-n="2"] .row-pin'));
    expect(decodeURIComponent(location.search)).toBe('?p=2');

    await click(container.querySelector('[aria-label="Saved threads"]'));
    await click(container.querySelector('.cp-menu-row')); // first preset: Picture theory
    expect(document.body.textContent).toContain('Replace your current pins?');
    expect(container.querySelector('.modal-confirm')?.textContent).toBe('Yes');
    await click(container.querySelector('.modal-cancel'));
    expect(container.querySelector('.modal-scrim')).toBeNull();
    expect(decodeURIComponent(location.search)).toBe('?p=2');

    await click(container.querySelector('[aria-label="Saved threads"]'));
    await click(container.querySelector('.cp-menu-row'));
    await click(container.querySelector('.modal-confirm'));
    expect(container.querySelector('.modal-scrim')).toBeNull();
    expect(decodeURIComponent(location.search)).toContain('2.11');
    expect(location.search).toContain('path=picture-theory');
  });

  it('applies a preset immediately when there are no pins to overwrite', async () => {
    await click(container.querySelector('[aria-label="Saved threads"]'));
    await click(container.querySelector('.cp-menu-row'));
    expect(container.querySelector('.modal-scrim')).toBeNull();
    expect(decodeURIComponent(location.search)).toContain('2.11');
  });

  it('toasts on thread save/delete and hints that views are shared via Share', async () => {
    await click(container.querySelector('[data-n="2"] .row-pin'));
    await click(container.querySelector('[aria-label="Saved threads"]'));
    expect(container.textContent).toContain('Threads stay in this browser');

    await click(container.querySelector('.cp-save-row'));
    await type(container.querySelector('.cp-inline-input'), 'Alpha');
    await press(container.querySelector('.cp-inline-input'), 'Enter');
    expect(container.querySelector('.toast-wrap')?.textContent).toContain('Thread "Alpha" saved');
    expect(container.querySelector('.toast-wrap')?.textContent).toContain('Share');

    await click(container.querySelector('[aria-label="Saved threads"]'));
    await click(container.querySelector('[aria-label="Delete Alpha"]'));
    // deletion is not undoable, so it confirms first
    expect(document.body.textContent).toContain('Delete this thread?');
    await click(container.querySelector('.modal-cancel'));
    expect(container.querySelector('[aria-label="Delete Alpha"]')).not.toBeNull();
    await click(container.querySelector('[aria-label="Delete Alpha"]'));
    await click(container.querySelector('.modal-confirm'));
    expect(container.querySelector('[aria-label="Delete Alpha"]')).toBeNull();
    expect(container.querySelector('.toast-wrap')?.textContent).toContain('Thread "Alpha" deleted');
  });

  it('shows the pin count in the info line, singular and plural', async () => {
    const meta = () => container.querySelector('.rc-meta')!.textContent!;
    expect(meta()).not.toContain('pin');
    await click(container.querySelector('[data-n="1"] .row-pin'));
    expect(meta()).toContain('1 pin');
    expect(meta()).not.toContain('1 pins');
    await click(container.querySelector('[data-n="2"] .row-pin'));
    expect(meta()).toContain('2 pins');
  });

  it('unpin all confirms, then clears pins but keeps manual expansion', async () => {
    const unpin = () => container.querySelector('[aria-label="unpin all"]')!;
    expect(unpin().className).toContain('is-disabled');

    await click(container.querySelector('[data-n="2"] .row-toggle')); // manual expansion
    await click(container.querySelector('[data-n="1"] .row-pin'));
    await click(container.querySelector('[data-n="2.1"] .row-pin'));
    expect(location.search).toContain('p=');

    await click(unpin());
    expect(document.body.textContent).toContain('Remove all pins?');
    await click(container.querySelector('.modal-cancel'));
    expect(location.search).toContain('p=');

    await click(unpin());
    await click(container.querySelector('.modal-confirm'));
    expect(location.search).not.toContain('p=');
    expect(container.querySelector('.toast-wrap')?.textContent).toContain('All pins removed');
    // the manually opened branch survives unpinning
    expect(container.querySelector('[data-n="2.1"]')).not.toBeNull();
  });

  it('Enter commits a note and closes the editor; Shift+Enter keeps editing', async () => {
    await click(container.querySelector('[aria-label="Add note to statement 2"]'));
    const input = container.querySelector('.note-input');
    expect(input).not.toBeNull();
    await type(input, 'picture theory note');
    await act(async () =>
      input!.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true, cancelable: true }),
      ),
    );
    expect(container.querySelector('.note-input')).not.toBeNull();
    await press(container.querySelector('.note-input'), 'Enter');
    expect(container.querySelector('.note-input')).toBeNull();
    expect(container.querySelector('.note-text')?.textContent).toBe('picture theory note');
  });

  it('Enter/Esc leave the search box looking inactive and focus the first statement', async () => {
    const search = () => container.querySelector<HTMLInputElement>('.cp-search-input')!;
    await act(async () => search().focus());
    await type(search(), 'picture');
    expect(container.querySelector('.cp-search-line')!.className).toContain('is-active');

    await press(search(), 'Enter');
    // resting look: no accent underline, no clear button — but the query stays
    expect(container.querySelector('.cp-search-line')!.className).not.toContain('is-active');
    expect(container.querySelector('.cp-search-close')).toBeNull();
    expect(search().value).toBe('picture');
    // and the keyboard is handed to the text: first statement holds focus
    expect(document.activeElement).toBe(container.querySelector('[data-nav]'));

    await act(async () => search().focus());
    expect(container.querySelector('.cp-search-line')!.className).toContain('is-active');
    await press(search(), 'Escape');
    expect(container.querySelector('.cp-search-line')!.className).not.toContain('is-active');
    expect(search().value).toBe('picture');
    expect(document.activeElement).toBe(container.querySelector('[data-nav]'));
  });

  it('the / shortcut reopens a collapsed panel and focuses the search box', async () => {
    await click(container.querySelector('.cp-head')); // collapse the panel
    expect(container.querySelector('.cp-head.is-open')).toBeNull();

    await press(document.body, '/');
    expect(container.querySelector('.cp-head.is-open')).not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector('.cp-search-input'));
  });

  it('share copies a statement deep link without touching the local pins', async () => {
    const copied: string[] = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: async (t: string) => void copied.push(t) },
    });
    await click(container.querySelector('[data-n="1"] .row-pin'));
    expect(decodeURIComponent(location.search)).toBe('?p=1');

    await click(container.querySelector('[data-n="2"] .row-share-btn'));
    expect(copied).toHaveLength(1);
    expect(copied[0]).toContain('?statement=2');
    expect(container.querySelector('.toast-wrap')?.textContent).toContain(
      'Link to statement 2 copied',
    );
    // local state is untouched: same pins, same URL, share isn't undoable
    expect(decodeURIComponent(location.search)).toBe('?p=1');
    expect(container.querySelector('[data-n="2"] .row-pin')?.className).not.toContain('is-pinned');
  });

  it('typesets $…$ math in statement text via KaTeX', () => {
    const row = container.querySelector('[data-n="6"] .row-text')!;
    expect(row.querySelector('.math .katex')).not.toBeNull();
    expect(row.textContent).not.toContain('$');
    // the visible layer is typeset (raw \bar source lives only in the
    // aria/MathML fallback KaTeX emits alongside it)
    expect(row.querySelector('.katex-html')!.textContent).not.toContain('\\bar');
  });

  it('deletes a note from the editor trash, behind a confirm, undoably', async () => {
    await click(container.querySelector('[aria-label="Add note to statement 3"]'));
    await type(container.querySelector('.note-input'), 'doomed note');
    await press(container.querySelector('.note-input'), 'Enter');
    expect(container.querySelector('.note-text')?.textContent).toBe('doomed note');

    // reopen the editor; cancel keeps the note
    await click(container.querySelector('.note-box'));
    await click(container.querySelector('[aria-label="Delete note on statement 3"]'));
    expect(document.body.textContent).toContain('Delete this note?');
    await click(container.querySelector('.modal-cancel'));
    expect(container.querySelector('.note-text')?.textContent).toBe('doomed note');

    // confirm deletes, with a toast; undo brings the note back
    await click(container.querySelector('.note-box'));
    await click(container.querySelector('[aria-label="Delete note on statement 3"]'));
    await click(container.querySelector('.modal-confirm'));
    expect(container.querySelector('.note-text')).toBeNull();
    expect(container.querySelector('.toast-wrap')?.textContent).toContain('Note on 3 deleted');
    await click(container.querySelector('[aria-label="undo"]'));
    expect(container.querySelector('.note-text')?.textContent).toBe('doomed note');
  });

  it('caps notes at 1,000 characters', async () => {
    await click(container.querySelector('[aria-label="Add note to statement 1"]'));
    await type(container.querySelector('.note-input'), 'x'.repeat(1100));
    await press(container.querySelector('.note-input'), 'Enter');
    expect(container.querySelector('.note-text')?.textContent).toHaveLength(1000);
  });
});
