/*
  The curated reading paths are hand-authored against the full text; a typo in a
  pin only surfaces at runtime as "Unknown statement: N". The smoke test mounts
  over the 25-node fixture and so cannot catch it — this can.
*/

import { describe, expect, it } from 'vitest';
import { READING_PATHS, pathById } from './paths';
import { byId } from '../model/tree';

describe('reading paths', () => {
  it('pins only statements that exist in the tree', () => {
    for (const path of READING_PATHS) {
      const unknown = path.pins.filter((n) => !byId.has(n));
      expect(unknown, `${path.id} pins unknown statements`).toEqual([]);
    }
  });

  it('has unique ids and no empty paths', () => {
    const ids = READING_PATHS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(pathById.size).toBe(READING_PATHS.length);
    for (const path of READING_PATHS) {
      expect(path.pins.length, `${path.id} is empty`).toBeGreaterThan(0);
      expect(new Set(path.pins).size, `${path.id} repeats a pin`).toBe(path.pins.length);
    }
  });
});
