import { describe, expect, it } from 'vitest';
import { decodeViewState, encodeViewState, statementParam } from './urlState';

describe('view state ⇄ link encoding (spec §7)', () => {
  it('round-trips a full view state', () => {
    const view = {
      pins: new Set(['1.11', '2.12']),
      overrides: new Map([
        ['2', true],
        ['1.2', false],
      ]),
      activeTerm: 'picture',
      activePath: 'picture-theory',
    };
    const decoded = decodeViewState(encodeViewState(view));
    expect(decoded).not.toBeNull();
    expect([...decoded!.pins!]).toEqual(['1.11', '2.12']);
    expect([...decoded!.overrides!]).toEqual([
      ['2', true],
      ['1.2', false],
    ]);
    expect(decoded!.activeTerm).toBe('picture');
    expect(decoded!.activePath).toBe('picture-theory');
  });

  it('encodes the empty state as an empty string', () => {
    expect(
      encodeViewState({
        pins: new Set(),
        overrides: new Map(),
        activeTerm: null,
        activePath: null,
      }),
    ).toBe('');
  });

  it('returns null when no view params are present', () => {
    expect(decodeViewState('')).toBeNull();
    expect(decodeViewState('?statement=2.11')).toBeNull();
    expect(decodeViewState('?utm_source=x')).toBeNull();
  });

  it('drops unknown statement ids, malformed overrides, unknown paths', () => {
    const decoded = decodeViewState('?p=1.11,99.9&e=2:1,zzz:1,1.2:9&t=&path=nope');
    expect([...decoded!.pins!]).toEqual(['1.11']);
    expect([...decoded!.overrides!]).toEqual([['2', true]]);
    expect(decoded!.activeTerm).toBeNull();
    expect(decoded!.activePath).toBeNull();
  });

  it('caps an oversized term', () => {
    const decoded = decodeViewState(`?t=${'x'.repeat(500)}`);
    expect(decoded!.activeTerm!.length).toBeLessThanOrEqual(100);
  });

  it('survives URL encoding of special characters in terms', () => {
    const qs = encodeViewState({
      pins: new Set(),
      overrides: new Map(),
      activeTerm: 'a b&c=d',
      activePath: null,
    });
    expect(decodeViewState(qs)!.activeTerm).toBe('a b&c=d');
  });

  it('validates the ?statement deep link', () => {
    expect(statementParam('?statement=2.11')).toBe('2.11');
    expect(statementParam('?statement=99')).toBeNull();
    expect(statementParam('')).toBeNull();
  });
});
