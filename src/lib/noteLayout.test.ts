import { describe, expect, it } from 'vitest';
import { computeNoteTops } from './noteLayout';

const overlaps = (tops: number[], heights: number[], gap: number) =>
  tops.some((t, i) => i > 0 && t < tops[i - 1] + heights[i - 1] + gap);

describe('computeNoteTops', () => {
  it('leaves uncrowded notes at their anchors', () => {
    expect(computeNoteTops([0, 200, 400], [50, 50, 50], 12)).toEqual([0, 200, 400]);
  });

  it('pushes crowded notes down by exactly height + gap', () => {
    const tops = computeNoteTops([0, 30, 60], [100, 100, 40], 12);
    expect(tops).toEqual([0, 112, 224]);
    expect(overlaps(tops, [100, 100, 40], 12)).toBe(false);
  });

  it('a single note sits at its anchor', () => {
    expect(computeNoteTops([80], [500], 12)).toEqual([80]);
  });

  it('pins the active note to its anchor and pushes earlier notes up', () => {
    // note 0 is tall; without an active note it would push note 1 down
    const heights = [100, 60];
    expect(computeNoteTops([0, 30], heights, 12)).toEqual([0, 112]);
    // with note 1 active, note 1 stays at 30 and note 0 gives way upward
    const tops = computeNoteTops([0, 30], heights, 12, 1);
    expect(tops[1]).toBe(30);
    expect(tops[0]).toBe(30 - 12 - 100);
  });

  it('pushes notes below the active one down, never up', () => {
    const heights = [40, 200, 40];
    const tops = computeNoteTops([0, 60, 120], heights, 12, 1);
    expect(tops[1]).toBe(60);
    expect(tops[0]).toBe(0); // already clear of the active note
    expect(tops[2]).toBe(60 + 200 + 12);
    expect(overlaps(tops, heights, 12)).toBe(false);
  });

  it('never overlaps across a long crowded run', () => {
    const anchors = [0, 10, 20, 30, 40, 50];
    const heights = [80, 80, 80, 80, 80, 80];
    for (const active of [null, 0, 2, 5]) {
      const tops = computeNoteTops(anchors, heights, 12, active);
      expect(overlaps(tops, heights, 12)).toBe(false);
      if (active !== null) expect(tops[active]).toBe(anchors[active]);
    }
  });
});
