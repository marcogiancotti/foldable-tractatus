/*
  The contrast floor, enforced.

  The design system's "chrome sits quiet until hover" rule was originally taken
  literally — 24% ink — which put nearly every control under WCAG 1.4.3/1.4.11
  without anything noticing. This test reads tokens.css and re-derives the ratios
  from source, so a future token tweak cannot quietly drop below its floor again.

  No new dependencies: the sRGB relative-luminance formula is ~10 lines, and the
  alpha compositing is the same `over` that a browser does when it paints
  rgba(...) text on --paper.
*/

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type RGB = [number, number, number];

const CSS = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

/** The :root block, and the [data-theme='dark'] block, as name → value maps. */
function themeBlock(selector: string): Record<string, string> {
  // Only the first matching block: the prefers-contrast overrides come later and
  // are a separate, stricter contract.
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`no ${selector} block in tokens.css`);
  const body = CSS.slice(CSS.indexOf('{', start) + 1, CSS.indexOf('}', start));
  const out: Record<string, string> = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

function parseColor(v: string): { rgb: RGB; alpha: number } {
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return { rgb: [(n >> 16) & 255, (n >> 8) & 255, n & 255], alpha: 1 };
  }
  const rgba = v.match(/^rgba?\(([^)]+)\)$/);
  if (rgba) {
    const parts = rgba[1].split(',').map((p) => parseFloat(p.trim()));
    return { rgb: [parts[0], parts[1], parts[2]], alpha: parts[3] ?? 1 };
  }
  throw new Error(`unparseable color: ${v}`);
}

const linear = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};

const luminance = ([r, g, b]: RGB) =>
  0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

const over = (fg: RGB, alpha: number, bg: RGB): RGB =>
  fg.map((c, i) => c * alpha + bg[i] * (1 - alpha)) as RGB;

function ratio(a: RGB, b: RGB): number {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** A token composited over its own theme's paper. */
function against(tokens: Record<string, string>, name: string, bgName = '--paper'): number {
  const { rgb, alpha } = parseColor(tokens[name]);
  const bg = parseColor(tokens[bgName]);
  const base = over(bg.rgb, bg.alpha, [255, 255, 255]);
  return ratio(over(rgb, alpha, base), base);
}

// 4.5 for text (1.4.3); 3.0 for UI components and icon affordances (1.4.11).
const FLOORS: Array<[string, number, string]> = [
  ['--ink100', 4.5, 'body text'],
  ['--ink60', 4.5, 'statement numbers at 13px'],
  ['--ink40', 4.5, 'quiet text — "(cf. N)", menu counts'],
  ['--ink24', 3.0, 'icon chrome — pin, note, share'],
  ['--control-border', 3.0, 'control boundaries'],
  ['--accent', 4.5, 'accent text and links'],
];

describe.each(["light (:root)", "dark ([data-theme='dark'])"])('%s', (label) => {
  const tokens = themeBlock(label.startsWith('light') ? ':root {' : ":root[data-theme='dark']");

  it.each(FLOORS)('%s clears %s:1 — %s', (token, floor) => {
    expect(against(tokens, token)).toBeGreaterThanOrEqual(floor);
  });

  // The 11px occurrence badges are accent-on-wash, not accent-on-paper: the
  // wash sits between them and the page, and it is the pairing that regressed.
  it('accent on --accent-wash clears 4.5:1 (the occurrence badges)', () => {
    const paper = parseColor(tokens['--paper']);
    const wash = parseColor(tokens['--accent-wash']);
    const accent = parseColor(tokens['--accent']);
    const washed = over(wash.rgb, wash.alpha, paper.rgb);
    expect(ratio(over(accent.rgb, accent.alpha, washed), washed)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps --hairline decorative — quiet enough to stay a hairline', () => {
    // Not a floor but a ceiling: if this ever clears 3:1 it has stopped being a
    // hairline and become a border, which is a design regression, not an a11y one.
    expect(against(tokens, '--hairline')).toBeLessThan(3.0);
  });
});
