/*
  Prefix-per-word matching — the single matching rule shared by curated
  inline term marks, active-term highlighting, and free-text search (spec §9/§9a).
*/

import { curatedTermFor } from '../data/terms';
import { proseForMatching } from '../lib/math';
import { statement } from './tree';

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Word stems an active term expands to: curated variants, or the raw query. */
export function variantsFor(term: string): string[] {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  const curated = curatedTermFor(q);
  return curated ? curated.variants : [q];
}

/** Regex source for one authored stem; spaces tolerate source line wrapping. */
export function variantPattern(stem: string): string {
  return stem.trim().split(/\s+/).map(escapeRegExp).join('\\s+');
}

/** Global regex matching every word that starts with any of the term's stems. */
export function termRegex(term: string): RegExp | null {
  const stems = [...variantsFor(term)].sort((a, b) => b.length - a.length);
  if (!stems.length) return null;
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${stems.map(variantPattern).join('|')})[a-z]*`, 'giu');
}

export function countInText(text: string, term: string): number {
  const re = termRegex(term);
  // prose only: $…$ LaTeX source (\bar, \xi, …) must never count as words
  return re ? (proseForMatching(text).match(re)?.length ?? 0) : 0;
}

/** Occurrences in one statement's own text. */
export function ownCount(n: string, term: string): number {
  return countInText(statement(n).text, term);
}

/** Occurrences in a statement and its whole subtree. */
export function subtreeCount(n: string, term: string): number {
  const s = statement(n);
  return s.children.reduce((sum, c) => sum + subtreeCount(c, term), ownCount(n, term));
}

/** All statement ids (reading order) whose text contains the term. */
export function matchingStatements(term: string, ids: readonly { n: string }[]): string[] {
  return ids.filter(({ n }) => ownCount(n, term) > 0).map(({ n }) => n);
}
