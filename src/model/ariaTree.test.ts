import { describe, expect, it, vi } from 'vitest';

// Same frozen 25-node fixture the focusedView tests use, so the worked examples
// below stay valid independent of the full ~526-statement text.
vi.mock('./tree', async (importActual) => {
  const actual = await importActual<typeof import('./tree')>();
  const { SAMPLE_TREE } = await import('./__fixtures__/sampleTree');
  return { ...actual, ...actual.buildTree(SAMPLE_TREE) };
});

import { annotateTree, itemKey } from './ariaTree';
import { deriveDisplay, unfoldAllOverrides } from './focusedView';
import type { DisplayItem } from './focusedView';

const none = new Set<string>();
const noOv = new Map<string, boolean>();

/** Compact "n level/pos-of-size" view of a display list, for readable expects. */
function shape(display: DisplayItem[]): string[] {
  const meta = annotateTree(display);
  return display.map((item, i) => {
    const { level, posinset, setsize } = meta[i];
    return `${itemKey(item)} L${level} ${posinset}/${setsize}`;
  });
}

describe('annotateTree', () => {
  it('numbers the seven root propositions as one sibling run', () => {
    const display = deriveDisplay(none, noOv);
    expect(shape(display)).toEqual([
      '1 L1 1/7',
      '2 L1 2/7',
      '3 L1 3/7',
      '4 L1 4/7',
      '5 L1 5/7',
      '6 L1 6/7',
      '7 L1 7/7',
    ]);
  });

  it('closes a deeper run when a shallower item appears', () => {
    // 1 expanded: its two children form a level-2 run of 2, then root 2 follows
    // and must still be 2 of 7 at level 1.
    const display = deriveDisplay(none, new Map([['1', true]]));
    expect(shape(display).slice(0, 4)).toEqual([
      '1 L1 1/7',
      '1.1 L2 1/2',
      '1.2 L2 2/2',
      '2 L1 2/7',
    ]);
  });

  it('does not merge same-depth runs under different parents', () => {
    const display = deriveDisplay(none, unfoldAllOverrides(none));
    const s = shape(display);
    // 1.11–1.13 are a run of 3 under 1.1 …
    expect(s).toContain('1.11 L3 1/3');
    expect(s).toContain('1.13 L3 3/3');
    // … and 1.21 is a run of 1 under 1.2, not 1.11's fourth sibling.
    expect(s).toContain('1.21 L3 1/1');
  });

  it('treats descendants as not interrupting their ancestors run', () => {
    const display = deriveDisplay(none, unfoldAllOverrides(none));
    const s = shape(display);
    // 2.01 has children (2.011, 2.012) rendered between it and 2.02, but 2.01,
    // 2.02 and 2.1 are still one run of 3.
    expect(s).toContain('2.01 L2 1/3');
    expect(s).toContain('2.02 L2 2/3');
    expect(s).toContain('2.1 L2 3/3');
  });

  it('gives every item a setsize of at least its own position', () => {
    const display = deriveDisplay(none, unfoldAllOverrides(none));
    for (const m of annotateTree(display)) {
      expect(m.setsize).toBeGreaterThanOrEqual(m.posinset);
      expect(m.posinset).toBeGreaterThan(0);
      expect(m.level).toBeGreaterThan(0);
    }
  });

  it('counts a peek range as a single sibling', () => {
    // Pinning 2.141 leaves 2.11–2.13 peeking as one range beside row 2.14.
    const display = deriveDisplay(new Set(['2.141']), noOv);
    const peeks = display.filter((d) => d.kind === 'peeks');
    expect(peeks.length).toBeGreaterThan(0);
    const meta = annotateTree(display);
    display.forEach((item, i) => {
      if (item.kind !== 'peeks') return;
      expect(meta[i].level).toBe(item.depth + 1);
      expect(meta[i].setsize).toBeGreaterThanOrEqual(1);
    });
  });

  it('returns one entry per display item', () => {
    const display = deriveDisplay(none, unfoldAllOverrides(none));
    expect(annotateTree(display)).toHaveLength(display.length);
  });

  it('handles an empty display', () => {
    expect(annotateTree([])).toEqual([]);
  });
});

describe('itemKey', () => {
  it('is the statement number for rows and a peek- prefix for ranges', () => {
    expect(itemKey({ kind: 'row', n: '2.11', depth: 2, state: 'full' })).toBe('2.11');
    expect(itemKey({ kind: 'peeks', depth: 2, members: ['2.12', '2.13'], label: '2.12–2.13' })).toBe(
      'peek-2.12',
    );
  });
});
