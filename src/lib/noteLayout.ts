/*
  Margin-note layout (spec §6): assign each note a vertical offset so that no
  two notes ever overlap. A note wants to sit at its anchor (its statement's
  top); when notes crowd, later ones slide down just far enough.

  With an active note (the one being edited), that note is pinned exactly to
  its anchor: notes above it may be pushed up past their anchors to make room,
  notes below are pushed down. Pure geometry — the DOM measuring lives in the
  component layer.
*/

export function computeNoteTops(
  anchors: readonly number[],
  heights: readonly number[],
  gap: number,
  activeIndex: number | null = null,
): number[] {
  const n = anchors.length;
  const tops = new Array<number>(n);

  if (activeIndex !== null && activeIndex >= 0 && activeIndex < n) {
    tops[activeIndex] = anchors[activeIndex];
    // above the active note: pushed up, never down
    for (let i = activeIndex - 1; i >= 0; i--) {
      tops[i] = Math.min(anchors[i], tops[i + 1] - gap - heights[i]);
    }
    // below: pushed down, never up
    let floor = tops[activeIndex] + heights[activeIndex];
    for (let i = activeIndex + 1; i < n; i++) {
      tops[i] = Math.max(anchors[i], floor + gap);
      floor = tops[i] + heights[i];
    }
    return tops;
  }

  let floor = -Infinity;
  for (let i = 0; i < n; i++) {
    tops[i] = Math.max(anchors[i], floor + gap);
    floor = tops[i] + heights[i];
  }
  return tops;
}
