/*
  Curated term index (spec §9) — hand-authored technical vocabulary.
  Each term: canonical form + variant word-stems. Matching is prefix-based
  per word (a stem matches the word and its inflections), the same rule
  free-text search uses, so the two entry points behave identically (§9a).

  Authored against the current subset; extend alongside the full text.
*/

export interface CuratedTerm {
  canonical: string;
  variants: string[]; // word stems, lowercase; always includes the canonical
}

export const CURATED_TERMS: CuratedTerm[] = [
  { canonical: 'world', variants: ['world'] },
  { canonical: 'fact', variants: ['fact'] },
  { canonical: 'picture', variants: ['picture', 'pictorial'] },
  { canonical: 'object', variants: ['object'] },
  { canonical: 'thought', variants: ['thought', 'think'] },
  { canonical: 'proposition', variants: ['proposition'] },
  { canonical: 'logic', variants: ['logic'] },
  { canonical: 'atomic', variants: ['atomic'] },
  { canonical: 'reality', variants: ['reality'] },
  { canonical: 'space', variants: ['space', 'spatial'] },
  { canonical: 'truth', variants: ['truth', 'true'] },
];

const byVariant = new Map<string, CuratedTerm>();
for (const t of CURATED_TERMS) for (const v of t.variants) byVariant.set(v, t);

/** The curated term a (lowercased) canonical/variant belongs to, if any. */
export function curatedTermFor(term: string): CuratedTerm | undefined {
  return byVariant.get(term.trim().toLowerCase());
}
