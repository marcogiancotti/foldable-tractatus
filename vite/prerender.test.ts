/*
  The prerendered shell is the only copy of the book that non-JS crawlers ever
  see, and it is generated at build time where nobody looks at it. These tests
  are the thing that notices when it silently stops containing the book.
*/

import { describe, expect, it } from 'vitest';
import { STATEMENTS, byId } from '../src/model/tree';
import { SITE_URL } from '../src/lib/site';
import prerender, { renderShell, renderSitemap, renderStatementText } from './prerender';

const shell = renderShell();

describe('prerendered shell', () => {
  it('contains every statement in the tree', () => {
    const missing = STATEMENTS.filter((s) => !shell.includes(`<li id="s-${s.n}">`));
    expect(missing.map((s) => s.n)).toEqual([]);
    expect(STATEMENTS).toHaveLength(526);
  });

  it('renders the seven root propositions as headings', () => {
    expect(shell.match(/<h2 class="pr-n"/g)).toHaveLength(7);
  });

  it('leaks no authoring syntax — LaTeX, emphasis macros or block sentinels', () => {
    expect(shell).not.toContain('\\emph{');
    expect(shell).not.toContain('[[block:');
    // A stray `$` would mean an unclosed math span slipped through the parser.
    expect(shell).not.toContain('$');
  });

  it('carries the actual prose of a statement, not just its number', () => {
    expect(shell).toContain('Whereof one cannot speak, thereof one must be silent.');
    expect(shell).toContain('The world is everything that is the case.');
  });

  it('turns cross-references into resolvable internal links', () => {
    // 5.31 references 4.31 and 4.442 (src/data/tractatus.ts).
    expect(shell).toContain('<a href="/?statement=4.31">4.31</a>');
    expect(shell).toContain('<a href="/?statement=4.442">4.442</a>');
    // Every emitted statement link must point at a statement that exists.
    for (const [, id] of shell.matchAll(/href="\/\?statement=([^"]+)"/g)) {
      expect(byId.has(decodeURIComponent(id))).toBe(true);
    }
  });

  it('credits the author and links both of their sites without nofollow', () => {
    expect(shell).toContain('Marco Giancotti');
    // The byline points at the personal site; the blog is a separate link.
    expect(shell).toContain('href="https://marcogiancotti.com"');
    expect(shell).toContain('href="https://aethermug.com"');
    expect(shell).toContain('rel="author me noopener"');
    expect(shell).not.toContain('nofollow');
    // noreferrer would hide this site from those sites' referral reports.
    expect(shell).not.toContain('noreferrer');
  });

  it('hides itself before first paint so the app never flashes it', () => {
    expect(shell).toContain("document.getElementById('prerender').hidden=true");
  });

  it('emits balanced <li>/<ol> nesting', () => {
    const count = (re: RegExp) => shell.match(re)?.length ?? 0;
    expect(count(/<li\b/g)).toBe(count(/<\/li>/g));
    expect(count(/<ol\b/g)).toBe(count(/<\/ol>/g));
    expect(count(/<h2\b/g)).toBe(count(/<\/h2>/g));
  });

  it('escapes markup so statement text can never inject an element', () => {
    expect(renderStatementText('a < b & c > d')).toBe('a &lt; b &amp; c &gt; d');
  });

  it('keeps readable inline variables but drops real LaTeX', () => {
    expect(renderStatementText('if $p$ then $q$')).toBe('if p then q');
    expect(renderStatementText("the $\\Omega'\\eta$ case")).toBe('the  case');
  });
});

describe('sitemap', () => {
  it('advertises exactly the canonical URL', () => {
    const xml = renderSitemap('2026-07-30');
    expect(xml).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    expect(xml.match(/<loc>/g)).toHaveLength(1);
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(xml).toContain('<lastmod>2026-07-30</lastmod>');
  });
});

/*
  The guard exists because a canonical pointing at the wrong origin de-indexes
  the site, and nothing else in the pipeline would notice.
*/
describe('canonical guard', () => {
  const run = (html: string) => {
    const plugin = prerender({ lastmod: '2026-07-30' });
    const hook = plugin.transformIndexHtml;
    if (typeof hook !== 'object' || typeof hook.handler !== 'function') {
      throw new Error('expected an object-form transformIndexHtml hook');
    }
    // The hook's ctx arg is unused by this plugin.
    return hook.handler.call(
      null as never,
      html,
      null as never,
    ) as unknown as string;
  };

  const ok =
    `<link rel="canonical" href="${SITE_URL}/" />` + `<body><div id="root"></div></body>`;

  it('injects the shell ahead of the React root', () => {
    const out = run(ok);
    expect(out).toContain('<div id="prerender">');
    expect(out.indexOf('id="prerender"')).toBeLessThan(out.indexOf('id="root"'));
  });

  it('fails the build when index.html and SITE_URL disagree', () => {
    expect(() => run('<link rel="canonical" href="https://example.com/" /><div id="root"></div>'))
      .toThrow(/canonical/);
  });

  it('fails the build when the React root moves', () => {
    expect(() => run(`<link rel="canonical" href="${SITE_URL}/" /><div id="app"></div>`)).toThrow(
      /id="root"/,
    );
  });
});
