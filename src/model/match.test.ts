import { describe, expect, it, vi } from 'vitest';

// Run against the frozen 25-node fixture so counts don't shift with the full text.
vi.mock('./tree', async (importActual) => {
  const actual = await importActual<typeof import('./tree')>();
  const { SAMPLE_TREE } = await import('./__fixtures__/sampleTree');
  return { ...actual, ...actual.buildTree(SAMPLE_TREE) };
});

import { countInText, matchingStatements, subtreeCount, termRegex, variantsFor } from './match';
import { STATEMENTS } from './tree';

describe('prefix-per-word matching (spec §9/§9a)', () => {
  it('matches a word and its inflections by prefix', () => {
    expect(countInText('The picture presents pictures, pictorially.', 'picture')).toBe(3);
  });

  it('matches qualified terms across whitespace and emphasis boundaries', () => {
    expect(countInText('an atomic\nfact and another atomic \\emph{fact}', 'atomic fact')).toBe(2);
  });

  it('does not match a qualified term across math or paragraph boundaries', () => {
    expect(countInText('atomic $p$ fact', 'atomic fact')).toBe(0);
    expect(countInText('atomic\n\nfact', 'atomic fact')).toBe(0);
  });

  it('does not match mid-word', () => {
    expect(countInText('outpicture', 'picture')).toBe(0);
    expect(countInText('überfact', 'fact')).toBe(0);
  });

  it('matches authored non-ASCII variants at Unicode word boundaries', () => {
    expect(countInText('Æsthetics and aesthetics are one.', 'aesthetics')).toBe(2);
    expect(countInText('cæsthetics', 'aesthetics')).toBe(0);
  });

  it('is case-insensitive', () => {
    expect(countInText('Truth and TRUE things', 'truth')).toBe(2);
  });

  it('expands curated variants (search and inline click behave identically)', () => {
    expect(variantsFor('truth')).toEqual(['truth', 'true']);
    expect(countInText('The totality of true thoughts', 'truth')).toBe(1);
  });

  it('treats a non-indexed query as its own stem', () => {
    expect(variantsFor('silent')).toEqual(['silent']);
    expect(countInText('one must be silent.', 'silent')).toBe(1);
  });

  it('escapes regex metacharacters in free queries', () => {
    expect(termRegex('a(b')).not.toBeNull();
    expect(countInText('nothing here', 'a(b')).toBe(0);
  });

  it('returns null/zero for empty queries', () => {
    expect(termRegex('   ')).toBeNull();
    expect(countInText('anything', '')).toBe(0);
  });

  it('counts occurrences across a subtree', () => {
    // "picture" occurrences under 2.1: 2.1(1) + 2.11(1) + 2.12(1) + 2.13(2) + 2.14(1) + 2.141(1)
    expect(subtreeCount('2.1', 'picture')).toBe(7);
  });

  it('lists matching statements in reading order', () => {
    const ids = matchingStatements('silent', STATEMENTS);
    expect(ids).toEqual(['7']);
  });
});
