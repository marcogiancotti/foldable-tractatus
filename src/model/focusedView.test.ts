import { describe, expect, it } from 'vitest';
import {
  deriveDisplay,
  deriveFlat,
  expandSubtree,
  foldAllOverrides,
  promotePeeks,
  setRowExpansion,
  unfoldAllOverrides,
} from './focusedView';
import { STATEMENTS, statement } from './tree';

const none = new Set<string>();
const noOv = new Map<string, boolean>();
const pins = (...ids: string[]) => new Set(ids);

const ids = (flat: ReturnType<typeof deriveFlat>) => flat.map((e) => `${e.n}:${e.state}`);

describe('default state (no pins, no overrides)', () => {
  it('shows only the seven roots', () => {
    expect(ids(deriveFlat(none, noOv))).toEqual([
      '1:collapsed',
      '2:collapsed',
      '3:collapsed',
      '4:full',
      '5:full',
      '6:full',
      '7:full',
    ]);
  });

  it('proposition 7 has no children (no toggle)', () => {
    expect(statement('7').children).toEqual([]);
  });
});

describe('focused view derivation (worked example, spec §5: pins = {2.11})', () => {
  const flat = deriveFlat(pins('2.11'), noOv);

  it('derives the exact four-state layout', () => {
    expect(ids(flat)).toEqual([
      '1:collapsed',
      '2:full',
      '2.01:peek',
      '2.02:peek',
      '2.1:full',
      '2.11:full',
      '2.12:peek',
      '2.13:peek',
      '2.14:peek',
      '3:collapsed',
      '4:full',
      '5:full',
      '6:full',
      '7:full',
    ]);
  });

  it('hides everything below peek and collapsed nodes', () => {
    const visible = new Set(flat.map((e) => e.n));
    expect(visible.has('2.141')).toBe(false); // below peek 2.14
    expect(visible.has('1.1')).toBe(false); // below collapsed 1
    expect(visible.has('2.011')).toBe(false); // below peek 2.01
  });

  it('merges consecutive same-depth peeks into ranges', () => {
    const peeks = deriveDisplay(pins('2.11'), noOv).filter((d) => d.kind === 'peeks');
    expect(peeks).toEqual([
      { kind: 'peeks', depth: 1, members: ['2.01', '2.02'], label: '2.01–2.02' },
      { kind: 'peeks', depth: 2, members: ['2.12', '2.13', '2.14'], label: '2.12–2.14' },
    ]);
  });

  it('unpinning everything returns to the seven roots', () => {
    expect(deriveFlat(none, noOv)).toHaveLength(7);
  });
});

describe('peek labels', () => {
  it('an isolated peek with a hidden subtree shows … after its number', () => {
    // pins = {2.13}: under 2.1 the run 2.11–2.12 merges; 2.14 stands alone with a subtree
    const display = deriveDisplay(pins('2.13'), noOv);
    const labels = display.filter((d) => d.kind === 'peeks').map((d) => d.label);
    expect(labels).toContain('2.11–2.12');
    expect(labels).toContain('2.14…');
  });

  it('a childless isolated peek shows its bare number', () => {
    // pins = {1.12}: under 1.1, peeks 1.11 and 1.13 are isolated (1.12 sits between)
    const display = deriveDisplay(pins('1.12'), noOv);
    const labels = display.filter((d) => d.kind === 'peeks').map((d) => d.label);
    expect(labels).toContain('1.11');
    expect(labels).toContain('1.13');
    expect(labels).toContain('1.2…');
  });
});

describe('promotion (reveal) and manual expansion', () => {
  it('promoting a peek range reveals members as rows, subtrees still folded', () => {
    const p = pins('2.11');
    const ov = promotePeeks(p, noOv, ['2.12', '2.13', '2.14']);
    const flat = ids(deriveFlat(p, ov));
    expect(flat).toContain('2.12:full');
    expect(flat).toContain('2.13:full');
    expect(flat).toContain('2.14:collapsed');
    expect(flat.join()).not.toContain('2.141');
  });

  it('a promoted collapsed node can then be expanded with the chevron', () => {
    const p = pins('2.11');
    let ov = promotePeeks(p, noOv, ['2.14']);
    ov = setRowExpansion(p, ov, '2.14', true);
    expect(ids(deriveFlat(p, ov))).toContain('2.141:full');
  });

  it('manual unfold shows children as normal rows, not peeks (plain reading mode)', () => {
    const ov = setRowExpansion(none, noOv, '1', true);
    expect(ids(deriveFlat(none, ov))).toEqual(
      expect.arrayContaining(['1:full', '1.1:collapsed', '1.2:collapsed']),
    );
    expect(deriveFlat(none, ov).some((e) => e.state === 'peek')).toBe(false);
  });

  it('an override can collapse a derived-expanded pin ancestor', () => {
    const p = pins('2.11');
    const ov = setRowExpansion(p, noOv, '2.1', false);
    const visible = deriveFlat(p, ov).map((e) => e.n);
    expect(visible).not.toContain('2.11');
    expect(visible).toContain('2.1');
  });
});

describe('global fold controls (spec §3)', () => {
  it('fold all clears overrides: focused view when pins exist, bare roots otherwise', () => {
    expect(foldAllOverrides().size).toBe(0);
    expect(deriveFlat(pins('2.11'), foldAllOverrides()).length).toBeGreaterThan(7);
    expect(deriveFlat(none, foldAllOverrides())).toHaveLength(7);
  });

  it('unfold all reveals every statement as a full row', () => {
    const flat = deriveFlat(none, unfoldAllOverrides(none));
    expect(flat).toHaveLength(STATEMENTS.length);
    expect(flat.every((e) => e.state === 'full')).toBe(true);
  });

  it('unfold all with pins active shows everything (no peeks)', () => {
    const p = pins('2.11');
    const flat = deriveFlat(p, unfoldAllOverrides(p));
    expect(flat).toHaveLength(STATEMENTS.length);
    expect(flat.some((e) => e.state === 'peek')).toBe(false);
  });
});

describe('structural invariants (no level-skipping)', () => {
  const cases: Array<[Set<string>, Map<string, boolean>]> = [
    [none, noOv],
    [pins('2.11'), noOv],
    [pins('2.141', '1.21'), noOv],
    [pins('2.11'), promotePeeks(pins('2.11'), noOv, ['2.14'])],
    [pins('3.001', '2.012'), setRowExpansion(pins('3.001', '2.012'), noOv, '1', true)],
    [none, unfoldAllOverrides(none)],
  ];

  it('every visible non-root has its parent visible as an expanded full row', () => {
    for (const [p, ov] of cases) {
      const flat = deriveFlat(p, ov);
      const stateOf = new Map(flat.map((e) => [e.n, e.state]));
      for (const e of flat) {
        const parent = statement(e.n).parent;
        if (parent !== null) expect(stateOf.get(parent)).toBe('full');
      }
    }
  });

  it('every pinned statement is visible as a full row (absent conflicting overrides)', () => {
    for (const p of [pins('2.141'), pins('1.11', '3.01'), pins('2.011', '1.21', '7')]) {
      const stateOf = new Map(deriveFlat(p, noOv).map((e) => [e.n, e.state]));
      for (const id of p) expect(stateOf.get(id)).toBe('full');
    }
  });
});

describe('override normalization (sparse persistence)', () => {
  it('drops overrides that match the derived view', () => {
    let ov = setRowExpansion(none, noOv, '1', true);
    ov = setRowExpansion(none, ov, '1', false); // back to default
    expect(ov.size).toBe(0);
  });

  it('keeps overrides that promote peeks', () => {
    const p = pins('2.11');
    const ov = promotePeeks(p, noOv, ['2.12']);
    expect(ov.size).toBe(1);
  });

  it('expandSubtree opens every descendant', () => {
    const ov = expandSubtree(none, noOv, '2');
    const flat = deriveFlat(none, ov).map((e) => e.n);
    expect(flat).toContain('2.141');
    expect(flat).toContain('2.012');
  });
});
