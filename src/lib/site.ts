/*
  Site identity — the one place the deployed origin and the author's links are
  written down. The head tags in index.html hardcode SITE_URL out of necessity
  (they are static HTML, parsed before any JS runs), so if you change the domain
  you must change it in BOTH places; the prerender plugin asserts they agree so
  the build fails loudly rather than shipping a canonical that points elsewhere.

  Everything else — the sitemap, the JSON-LD graph, the footer — reads it here.
*/

/** Canonical origin, no trailing slash. Must match the <link rel="canonical"> in index.html. */
export const SITE_URL = 'https://foldabletractatus.aethermug.com';

export const SITE_NAME = 'The Foldable Tractatus';

export const AUTHOR_NAME = 'Marco Giancotti';

/**
 * The author's personal site — what the byline name links to, and the canonical
 * identity URL in the JSON-LD Person node.
 */
export const AUTHOR_URL = 'https://marcogiancotti.com';

/** The author's blog, linked separately from the byline. */
export const AUTHOR_BLOG_URL = 'https://aethermug.com';

export const AUTHOR_BLOG_NAME = 'Aether Mug';

export const REPO_URL = 'https://github.com/marcogiancotti/foldable-tractatus';

/** Absolute URL for a site-root-relative path, e.g. absoluteUrl('/og-image.png'). */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
