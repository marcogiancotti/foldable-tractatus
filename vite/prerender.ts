/*
  Build-time prerender of the whole book into index.html.

  Why this exists: the app is a client-rendered SPA whose <body> ships only
  `<div id="root"></div>`. Googlebot executes JS and eventually sees the text,
  but Bingbot, DuckDuckGo, every social-card scraper and the LLM crawlers
  largely do not — they index an empty div. The public-domain Ogden text is the
  most valuable and most linkable thing here, so it needs to be in the HTML
  source, not only in a JS bundle.

  What it emits, as a sibling of #root (never inside it — React owns that node):

      <div id="prerender"> …the h1, the 7 root propositions as <h2>, all 526
        statements as nested <ol>/<li>, and the footer attribution… </div>
      <script>…hidden = true…</script>
      <div id="root"></div>

  Two details carry weight:

  • The inline script sets `hidden` the instant the element finishes parsing, so
    a JS browser never paints the static copy — no flash. A crawler that does
    not run JS reads it in full. This is not cloaking: the statement text is
    verbatim the same text the app renders, and it doubles as a real no-JS
    fallback, which the site otherwise lacks. src/main.tsx then removes the node
    outright before React mounts, so it can never linger in the accessibility
    tree or catch the reading tree's roving-tabindex keyboard nav.

  • Cross-references become real <a href="/?statement=N">. The app has zero
    internal links — every term and pin interaction is an onClick handler — so
    without these a crawler has no path through the content at all.

  Runs only on `vite build`. In dev you get the normal empty shell, which keeps
  the dev server fast and means what you debug is what the app actually renders.

  This module is imported by vite.config.ts, which esbuild bundles — so the
  imports below are inlined at config-load time. That works only because
  src/model/tree.ts and src/lib/math.ts are pure: no DOM, no React, no
  import.meta.env. Keep them that way or this breaks.
*/

import type { Plugin } from 'vite';
import { parseStatement, type Segment } from '../src/lib/math';
import { ROOT_IDS, statement } from '../src/model/tree';
import {
  AUTHOR_BLOG_NAME,
  AUTHOR_BLOG_URL,
  AUTHOR_NAME,
  AUTHOR_URL,
  REPO_URL,
  SITE_NAME,
  SITE_URL,
} from '../src/lib/site';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/*
  Math is a judgement call. Dropping every `$…$` segment turns 5.31's
  “if “$p$”, “$q$”…” into “if “”, “”…”, which reads as broken prose; keeping raw
  LaTeX puts `\Omega'\eta` in a search snippet, which is worse. So: keep the
  source only when it is plain enough to read as text (a bare variable, a
  number), and drop it otherwise. KaTeX still renders the real thing in the app —
  this copy exists for crawlers and no-JS readers.
*/
const SIMPLE_MATH = /^[A-Za-z0-9\s,.''""()=+\-–—:;!?/|]*$/;

function renderSegments(segments: readonly Segment[]): string {
  return segments
    .map((seg) => {
      if (seg.kind === 'text') return escapeHtml(seg.value);
      if (seg.kind === 'emph') return `<em>${escapeHtml(seg.value)}</em>`;
      return SIMPLE_MATH.test(seg.value) ? escapeHtml(seg.value) : '';
    })
    .join('');
}

/** A statement's text as HTML prose: emphasis kept, figure/table blocks dropped. */
export function renderStatementText(text: string): string {
  return parseStatement(text)
    .filter((p) => p.kind === 'prose')
    .map((p) => (p.kind === 'prose' ? renderSegments(p.segments) : ''))
    .filter((s) => s.trim().length > 0)
    .join(' ');
}

function renderRefs(refs: readonly string[]): string {
  if (refs.length === 0) return '';
  const links = refs
    .map((r) => `<a href="/?statement=${encodeURIComponent(r)}">${escapeHtml(r)}</a>`)
    .join(', ');
  return ` <span class="pr-refs">(cf. ${links})</span>`;
}

function renderNode(n: string, depth: number): string {
  const s = statement(n);
  const body = renderStatementText(s.text) + renderRefs(s.refs);
  // The 7 root propositions become real headings — they are the book's sections,
  // and they give a crawler an outline instead of one undifferentiated blob.
  const line =
    depth === 0
      ? `<h2 class="pr-n"><span class="pr-num">${escapeHtml(n)}</span> ${body}</h2>`
      : `<p class="pr-n"><span class="pr-num">${escapeHtml(n)}</span> ${body}</p>`;
  const kids = s.children.length
    ? `<ol class="pr-kids">${s.children.map((c) => renderNode(c, depth + 1)).join('')}</ol>`
    : '';
  return `<li id="s-${escapeHtml(n)}">${line}${kids}</li>`;
}

/*
  Deliberately NOT a copy of the app's masthead prose (src/components/
  ReadingColumn.tsx). That copy is rich JSX, and duplicating four paragraphs of
  it here to keep them in sync would be a maintenance trap for no search gain —
  the 526 statements are the substance a crawler comes for. This is a short
  purpose-written orientation instead.
*/
const INTRO =
  'Wittgenstein&rsquo;s <cite>Tractatus Logico-Philosophicus</cite> is not a sequence of ' +
  'chapters but a tree: seven brief root propositions, each elaborated by numbered ' +
  'sub-statements, and those by sub-sub-statements in turn. This is an interactive reader ' +
  'that treats the decimal numbering as the tree it is &mdash; fold and unfold branches, pin ' +
  'statements to build a focused cross-section, trace a term through the book, and keep ' +
  'private margin notes. The complete text follows, in reading order.';

const STYLE = `
#prerender{max-width:42rem;margin:0 auto;padding:2rem 1.25rem;font-family:Georgia,serif;
line-height:1.6;color:#211f1b}
#prerender h1{font-size:1.9rem;line-height:1.15;margin:0 0 1rem}
#prerender h2{font-size:1.05rem;font-weight:600;margin:0}
#prerender ol{list-style:none;margin:0;padding:0 0 0 1.15rem}
#prerender>ol{padding-left:0}
#prerender li{margin:.6rem 0}
#prerender p{margin:0}
#prerender .pr-num{font-family:ui-monospace,monospace;font-size:.85em;color:#3f5a7a;
margin-right:.4rem}
#prerender .pr-refs{color:#3f5a7a;font-size:.9em}
#prerender footer{margin-top:8rem;padding-top:1.25rem;border-top:1px solid rgba(33,31,27,.2);
font-size:.85rem;color:rgba(33,31,27,.7)}
@media(prefers-color-scheme:dark){#prerender{color:#e9e6df}
#prerender footer{color:rgba(233,230,223,.6);border-top-color:rgba(233,230,223,.2)}}
`.replace(/\n/g, '');

export function renderShell(): string {
  const tree = ROOT_IDS.map((n) => renderNode(n, 0)).join('');
  return (
    `<style>${STYLE}</style>` +
    `<div id="prerender">` +
    `<h1>${escapeHtml(SITE_NAME)}</h1>` +
    `<p>${INTRO}</p>` +
    `<h2>Tractatus Logico-Philosophicus</h2>` +
    `<p>Ludwig Wittgenstein, 1922 &mdash; C. K. Ogden translation, public domain.</p>` +
    `<ol>${tree}</ol>` +
    `<footer>` +
    `<p>${escapeHtml(SITE_NAME)} was built by ` +
    `<a href="${AUTHOR_URL}" target="_blank" rel="author me noopener">` +
    `${escapeHtml(AUTHOR_NAME)}</a>. More writing at ` +
    `<a href="${AUTHOR_BLOG_URL}" target="_blank" rel="me noopener">` +
    `${escapeHtml(AUTHOR_BLOG_NAME)}</a>.</p>` +
    `<p>Text: the C. K. Ogden translation of 1922, in the public domain. ` +
    `Code: <a href="${REPO_URL}" target="_blank" rel="noopener">MIT-licensed and on GitHub</a>. ` +
    `Margin notes stay in your own browser.</p>` +
    `</footer>` +
    `</div>` +
    // Hides before first paint, so a JS browser never flashes this copy.
    `<script>document.getElementById('prerender').hidden=true</script>`
  );
}

/** `<url>` entries for sitemap.xml. Only `/` — see the comment in the plugin. */
export function renderSitemap(lastmod: string): string {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    `  <url>\n` +
    `    <loc>${SITE_URL}/</loc>\n` +
    `    <lastmod>${lastmod}</lastmod>\n` +
    `    <changefreq>monthly</changefreq>\n` +
    `  </url>\n` +
    `</urlset>\n`
  );
}

export interface PrerenderOptions {
  /** ISO date for the sitemap's <lastmod>. Injected so the plugin stays pure/testable. */
  lastmod: string;
}

export default function prerender({ lastmod }: PrerenderOptions): Plugin {
  return {
    name: 'foldable-tractatus:prerender',
    apply: 'build',

    transformIndexHtml: {
      order: 'post',
      handler(html) {
        // Guard against the one silent failure mode that matters: index.html's
        // hardcoded canonical drifting from SITE_URL. A canonical pointing at
        // the wrong origin de-indexes the site, and nothing else would catch it.
        if (!html.includes(`<link rel="canonical" href="${SITE_URL}/"`)) {
          throw new Error(
            `prerender: index.html has no <link rel="canonical" href="${SITE_URL}/">. ` +
              `index.html and SITE_URL in src/lib/site.ts must agree.`,
          );
        }
        if (!html.includes('<div id="root"></div>')) {
          throw new Error('prerender: could not find <div id="root"></div> in index.html.');
        }
        return html.replace('<div id="root"></div>', `${renderShell()}<div id="root"></div>`);
      },
    },

    generateBundle() {
      /*
        `/` only, deliberately. Listing the 526 ?statement=N URLs would be a
        duplicate-content sitemap: each serves byte-identical prerendered HTML
        and every one canonicalises to `/`, so Search Console would report all
        526 as excluded. One honest entry beats that.
      */
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: renderSitemap(lastmod),
      });
    },
  };
}
