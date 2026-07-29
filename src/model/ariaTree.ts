/*
  ARIA tree metadata for the derived display list.

  `deriveDisplay` (focusedView.ts) returns a FLAT list of rows and peek ranges
  carrying a `depth`. That is exactly the shape ARIA's flattened-tree pattern
  wants: no nested `role="group"` wrappers, with structure carried instead by
  `aria-level` / `aria-posinset` / `aria-setsize` on each `role="treeitem"`.

  This module derives that metadata and nothing else — it is deliberately
  separate from focusedView.ts, whose override/normalization invariants have no
  business knowing about presentation.

  Sibling runs: items at the same depth are siblings until a SHALLOWER item
  appears, which closes every deeper run beneath it. Deeper items in between are
  descendants and do not interrupt the run:

    1        level 1, 1 of 2       ┐ depth-0 run
      1.1    level 2, 1 of 2   ┐   │
      1.2    level 2, 2 of 2   ┘   │  (the depth-1 run closes when 2 appears)
    2        level 1, 2 of 2       ┘
*/

import type { DisplayItem } from './focusedView';

export interface TreeMeta {
  /** aria-level — 1-based, so depth 0 is level 1. */
  level: number;
  /** aria-posinset — 1-based position among siblings. */
  posinset: number;
  /** aria-setsize — total siblings in this run. */
  setsize: number;
}

export function annotateTree(display: readonly DisplayItem[]): TreeMeta[] {
  const meta: TreeMeta[] = display.map((item) => ({
    level: item.depth + 1,
    posinset: 0,
    setsize: 0,
  }));

  // Indices of the items in each still-open run, keyed by depth.
  const runs = new Map<number, number[]>();

  const closeRun = (depth: number) => {
    const run = runs.get(depth);
    if (!run) return;
    for (const i of run) meta[i].setsize = run.length;
    runs.delete(depth);
  };

  display.forEach((item, i) => {
    // A shallower item ends every run below it.
    for (const depth of [...runs.keys()]) {
      if (depth > item.depth) closeRun(depth);
    }
    const run = runs.get(item.depth) ?? [];
    run.push(i);
    runs.set(item.depth, run);
    meta[i].posinset = run.length;
  });

  for (const depth of [...runs.keys()]) closeRun(depth);
  return meta;
}

/**
 * Stable identity for a display item — the roving-tabindex target is tracked by
 * this key, since peek ranges have no single `n` of their own.
 */
export function itemKey(item: DisplayItem): string {
  return item.kind === 'row' ? item.n : `peek-${item.members[0]}`;
}
