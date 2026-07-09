/*
  The focused-view derivation — the crux of the app (spec §5, handoff 03).

  Every statement's display state (Full / Collapsed / Peek / Hidden) is DERIVED
  from the fixed tree + the pin set, with the reader's sparse expandOverrides
  applied on top. Peeks are computed, never managed.

  Override semantics (one boolean map, `expandOverrides`):
  - `true`  — manually expanded: the node shows Full and its children are shown.
  - `false` — manually collapsed: the node shows its text, children hidden.
  - The mere PRESENCE of an override on a would-be peek promotes it to a real
    row (peek → Collapsed/Full), which is how "reveal" works: promoting writes
    `false` (text shown, subtree still folded), and the chevron can then expand.

  Children of a node expanded *by derivation* (a pin ancestor) render Peek
  unless they are on a pin lineage or carry an override; children of a node
  expanded *manually* render as normal rows — plain reading mode is not the
  focused view (spec §3 vs §5).
*/

import { ROOT_IDS, ancestorsOf, statement } from './tree';

export type Pins = ReadonlySet<string>;
export type Overrides = ReadonlyMap<string, boolean>;

export type RowState = 'full' | 'collapsed';

export interface FlatEntry {
  n: string;
  depth: number;
  state: RowState | 'peek';
}

export type DisplayItem =
  | { kind: 'row'; n: string; depth: number; state: RowState }
  | { kind: 'peeks'; depth: number; members: string[]; label: string };

/** Every ancestor of every pinned statement. */
export function pinAncestorSet(pins: Pins): Set<string> {
  const out = new Set<string>();
  for (const p of pins) for (const a of ancestorsOf(p)) out.add(a);
  return out;
}

/** The ordered list of visible statements with their derived display states. */
export function deriveFlat(pins: Pins, overrides: Overrides): FlatEntry[] {
  const pinAnc = pinAncestorSet(pins);
  const out: FlatEntry[] = [];

  const visit = (n: string, depth: number, parentKind: 'manual' | 'derived' | null) => {
    const s = statement(n);
    const ov = overrides.get(n);
    const onLineage = pins.has(n) || pinAnc.has(n);

    if (parentKind === 'derived' && !onLineage && ov === undefined) {
      out.push({ n, depth, state: 'peek' });
      return; // everything below a peek is hidden
    }

    const hasChildren = s.children.length > 0;
    const expanded = hasChildren && (ov ?? pinAnc.has(n));
    out.push({ n, depth, state: !hasChildren || expanded ? 'full' : 'collapsed' });

    if (expanded) {
      const kind = ov === true ? 'manual' : 'derived';
      for (const c of s.children) visit(c, depth + 1, kind);
    }
  };

  for (const r of ROOT_IDS) visit(r, 0, null);
  return out;
}

/** Merge consecutive same-depth peeks into range rows (wireframe 2a). */
export function groupPeeks(flat: readonly FlatEntry[]): DisplayItem[] {
  const out: DisplayItem[] = [];
  for (let i = 0; i < flat.length; ) {
    const e = flat[i];
    if (e.state !== 'peek') {
      out.push({ kind: 'row', n: e.n, depth: e.depth, state: e.state });
      i++;
      continue;
    }
    const members: string[] = [];
    while (i < flat.length && flat[i].state === 'peek' && flat[i].depth === e.depth) {
      members.push(flat[i].n);
      i++;
    }
    const label =
      members.length === 1
        ? members[0] + (statement(members[0]).children.length ? '…' : '')
        : `${members[0]}–${members[members.length - 1]}`;
    out.push({ kind: 'peeks', depth: e.depth, members, label });
  }
  return out;
}

export function deriveDisplay(pins: Pins, overrides: Overrides): DisplayItem[] {
  return groupPeeks(deriveFlat(pins, overrides));
}

/* ---------- override editing ---------- */

function flatEquals(a: readonly FlatEntry[], b: readonly FlatEntry[]): boolean {
  return (
    a.length === b.length &&
    a.every((e, i) => e.n === b[i].n && e.depth === b[i].depth && e.state === b[i].state)
  );
}

/** Drop every override whose removal doesn't change what renders. */
export function normalizeOverrides(pins: Pins, overrides: Overrides): Map<string, boolean> {
  const next = new Map(overrides);
  let changed = true;
  while (changed) {
    changed = false;
    const rendered = deriveFlat(pins, next);
    for (const key of next.keys()) {
      const without = new Map(next);
      without.delete(key);
      if (flatEquals(deriveFlat(pins, without), rendered)) {
        next.delete(key);
        changed = true;
      }
    }
  }
  return next;
}

/** Manually expand (unfold one level) or collapse a visible row. */
export function setRowExpansion(
  pins: Pins,
  overrides: Overrides,
  n: string,
  expand: boolean,
): Map<string, boolean> {
  const next = new Map(overrides);
  next.set(n, expand);
  return normalizeOverrides(pins, next);
}

/** Promote peek members to real rows (text shown, subtrees still folded). */
export function promotePeeks(
  pins: Pins,
  overrides: Overrides,
  members: readonly string[],
): Map<string, boolean> {
  const next = new Map(overrides);
  for (const m of members) next.set(m, false);
  return normalizeOverrides(pins, next);
}

/** Expand a whole subtree ("unfold all beneath"). */
export function expandSubtree(
  pins: Pins,
  overrides: Overrides,
  n: string,
): Map<string, boolean> {
  const next = new Map(overrides);
  const visit = (id: string) => {
    if (statement(id).children.length) {
      next.set(id, true);
      statement(id).children.forEach(visit);
    }
  };
  visit(n);
  return normalizeOverrides(pins, next);
}

/**
 * Make a statement visible with minimal disturbance (cross-ref navigation,
 * deep links): expand folded ancestors, promote the target if it would peek.
 */
export function revealStatement(
  pins: Pins,
  overrides: Overrides,
  n: string,
): Map<string, boolean> {
  const next = new Map(overrides);
  const stateOf = (id: string) =>
    deriveFlat(pins, next).find((e) => e.n === id)?.state;
  for (const a of [...ancestorsOf(n)].reverse()) {
    const st = stateOf(a);
    if (st !== 'full') next.set(a, true); // hidden/peek/collapsed → open it
  }
  if (stateOf(n) === 'peek') next.set(n, false); // promote, subtree stays folded
  return normalizeOverrides(pins, next);
}

/** Fold all: clear overrides — focused view when pins exist, bare roots otherwise (spec §3). */
export function foldAllOverrides(): Map<string, boolean> {
  return new Map();
}

/** Unfold all: every parent open. */
export function unfoldAllOverrides(pins: Pins): Map<string, boolean> {
  const next = new Map<string, boolean>();
  for (const r of ROOT_IDS) {
    const visit = (id: string) => {
      if (statement(id).children.length) {
        next.set(id, true);
        statement(id).children.forEach(visit);
      }
    };
    visit(r);
  }
  return normalizeOverrides(pins, next);
}
