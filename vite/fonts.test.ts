/*
  Guards the self-hosted font stack, whose failure mode is quiet and ugly: the
  Material Symbols subset (scripts/build-fonts.sh) is generated from the icon
  names present in src/ at the time it ran. Add a new icon to a component and
  nothing complains at build time — the UI just renders the literal word
  "chevron_right" where a glyph should be.

  So: re-derive the icon names from source here, and fail if any of them is
  missing from the committed subset manifest. The fix when this fails is to run
  scripts/build-fonts.sh and commit the result.
*/

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = join(import.meta.dirname, '..');

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(e.name) ? [p] : [];
  });
}

const source = sourceFiles(join(root, 'src'))
  .map((p) => readFileSync(p, 'utf8'))
  .join('\n');

const manifest: string[] = JSON.parse(
  readFileSync(join(root, 'public/fonts/icon-names.json'), 'utf8'),
);

const fontsCss = readFileSync(join(root, 'src/styles/fonts.css'), 'utf8');
const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');

describe('Material Symbols subset', () => {
  /*
    The names a component can actually ask for come in two shapes, and both must
    be scanned because neither is visible to the other:

      1. the text child of an element whose className mentions `msym` — either a
         bare name, or a ternary between two names;
      2. the `icon:` field of the ControlPanel / ReaderGuide / MobileControls
         descriptor arrays, which reach the same element through a variable.

    Finding (1) needs a real scan rather than a regex: these opening tags carry
    onClick handlers, so they contain `=>` and nested braces, and the first `>`
    after the className is usually part of an arrow function rather than the end
    of the tag.
  */
  const referenced = new Set<string>();

  /** Index of the `>` that closes the JSX opening tag starting at `from`. */
  function endOfOpeningTag(text: string, from: number): number {
    let depth = 0;
    let quote: string | null = null;
    for (let i = from; i < text.length; i++) {
      const c = text[i];
      if (quote) {
        if (c === quote && text[i - 1] !== '\\') quote = null;
        continue;
      }
      if (c === '"' || c === "'" || c === '`') quote = c;
      else if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && text[i - 1] !== '=') return i;
    }
    return -1;
  }

  for (const m of source.matchAll(/msym/g)) {
    const tagStart = source.lastIndexOf('<', m.index);
    if (tagStart < 0) continue;
    const tagEnd = endOfOpeningTag(source, tagStart);
    if (tagEnd < 0) continue;
    const child = source.slice(tagEnd + 1, source.indexOf('<', tagEnd + 1)).trim();
    if (/^[a-z][a-z0-9_]{2,}$/.test(child)) {
      referenced.add(child);
    } else if (child.startsWith('{')) {
      /*
        A ternary between two literal names, e.g.
        {open ? 'chevron_left' : 'chevron_right'}. Only the two branches are
        icons — a literal in the *condition* is not, which is why this reads the
        branches specifically rather than every string in the expression
        ({theme === 'dark' ? …} would otherwise contribute "dark"). A bare
        {variable} yields nothing here and is covered by the `icon:` scan below.
      */
      const ternary = child.match(
        /\?\s*'([a-z][a-z0-9_]{2,})'\s*:\s*'([a-z][a-z0-9_]{2,})'/,
      );
      if (ternary) {
        referenced.add(ternary[1]);
        referenced.add(ternary[2]);
      }
    }
  }

  for (const m of source.matchAll(/icon:\s*'([a-z][a-z0-9_]{2,})'/g)) referenced.add(m[1]);

  it('finds icon references to check at all (the scan itself can rot)', () => {
    expect(referenced.size).toBeGreaterThan(10);
    // Sanity: names known to be in the UI must be picked up by the scan above.
    for (const known of ['chevron_right', 'push_pin', 'unfold_less', 'undo']) {
      expect(referenced).toContain(known);
    }
  });

  it('ships every icon the source asks for', () => {
    const set = new Set(manifest);
    // Words that are only prose, never passed to a .msym element, are allowed to
    // be absent — but anything the scan identified as an icon must be present.
    const missing = [...referenced].filter((n) => !set.has(n));
    expect(missing).toEqual([]);
  });
});

describe('self-hosted fonts', () => {
  it('no longer reaches out to Google Fonts', () => {
    expect(indexHtml).not.toContain('fonts.googleapis.com');
    expect(indexHtml).not.toContain('fonts.gstatic.com');
    expect(fontsCss).not.toContain('https://fonts.g');
  });

  it('declares every family the design tokens rely on', () => {
    for (const family of ['Hanken Grotesk', 'IBM Plex Mono', 'Material Symbols Outlined']) {
      expect(fontsCss).toContain(`font-family: '${family}'`);
    }
  });

  it('references only font files that exist', () => {
    const shipped = new Set(readdirSync(join(root, 'public/fonts')));
    const urls = [...fontsCss.matchAll(/url\('\/fonts\/([^']+)'\)/g)].map((m) => m[1]);
    expect(urls.length).toBeGreaterThan(5);
    expect(urls.filter((f) => !shipped.has(f))).toEqual([]);
  });

  it('preloads fonts that exist, so the hint is never wasted', () => {
    const shipped = new Set(readdirSync(join(root, 'public/fonts')));
    const preloads = [...indexHtml.matchAll(/rel="preload"[\s\S]*?href="\/fonts\/([^"]+)"/g)].map(
      (m) => m[1],
    );
    expect(preloads.length).toBeGreaterThan(0);
    expect(preloads.filter((f) => !shipped.has(f))).toEqual([]);
  });
});
