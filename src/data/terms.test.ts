import { describe, expect, it } from 'vitest';
import { proseForMatching } from '../lib/math';
import { matchingStatements, variantPattern } from '../model/match';
import { STATEMENTS } from '../model/tree';
import { CURATED_TERMS, curatedTermForMatch } from './terms';

describe('curated technical-term index', () => {
  it('is normalized, alphabetized, and unambiguous', () => {
    const canonicals = new Set<string>();
    const variants = new Set<string>();

    for (const term of CURATED_TERMS) {
      expect(term.canonical).toBe(term.canonical.trim().toLowerCase());
      expect(term.variants[0]).toBe(term.canonical);
      expect(canonicals.has(term.canonical)).toBe(false);
      canonicals.add(term.canonical);

      for (const variant of term.variants) {
        expect(variant).toBe(variant.trim().toLowerCase());
        expect(variants.has(variant)).toBe(false);
        variants.add(variant);
      }
    }

    expect(CURATED_TERMS.map((term) => term.canonical)).toEqual(
      [...CURATED_TERMS.map((term) => term.canonical)].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('contains a prose occurrence for every entry', () => {
    const missing = CURATED_TERMS
      .filter((term) => matchingStatements(term.canonical, STATEMENTS).length === 0)
      .map((term) => term.canonical);
    expect(missing).toEqual([]);
  });

  it('indexes base and qualified concepts separately', () => {
    expect(CURATED_TERMS.some((term) => term.canonical === 'fact')).toBe(true);
    expect(CURATED_TERMS.some((term) => term.canonical === 'atomic fact')).toBe(true);
    expect(CURATED_TERMS.some((term) => term.canonical === 'logical form')).toBe(true);
    expect(CURATED_TERMS).toHaveLength(207);
  });

  it('attributes overlaps to the longest qualified entry', () => {
    expect(curatedTermForMatch('atomic facts')?.canonical).toBe('atomic fact');
    expect(curatedTermForMatch('logical forms')?.canonical).toBe('logical form');
    expect(curatedTermForMatch('facts')?.canonical).toBe('fact');
  });

  it('gives every entry an independently clickable inline occurrence', () => {
    const stems = CURATED_TERMS.flatMap((term) => term.variants).sort((a, b) => b.length - a.length);
    const indexRegex = new RegExp(
      `(?<![\\p{L}\\p{N}_])(?:${stems.map(variantPattern).join('|')})[a-z]*`,
      'giu',
    );
    const owners = new Set<string>();
    for (const statement of STATEMENTS) {
      for (const match of proseForMatching(statement.text).matchAll(indexRegex)) {
        const owner = curatedTermForMatch(match[0]);
        if (owner) owners.add(owner.canonical);
      }
    }

    expect(CURATED_TERMS.filter((term) => !owners.has(term.canonical)).map((term) => term.canonical)).toEqual([]);
  });
});
