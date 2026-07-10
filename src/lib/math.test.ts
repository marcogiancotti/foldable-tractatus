import { describe, expect, it } from 'vitest';
import { splitMath, stripMath } from './math';

describe('splitMath', () => {
  it('plain prose is one text segment', () => {
    expect(splitMath('The world is everything that is the case.')).toEqual([
      { math: false, value: 'The world is everything that is the case.' },
    ]);
  });

  it('extracts a $…$ segment between prose', () => {
    expect(splitMath('form is $[\\bar p]$ here.')).toEqual([
      { math: false, value: 'form is ' },
      { math: true, value: '[\\bar p]' },
      { math: false, value: ' here.' },
    ]);
  });

  it('handles several segments and math at the ends', () => {
    expect(splitMath('$a$ and $b$')).toEqual([
      { math: true, value: 'a' },
      { math: false, value: ' and ' },
      { math: true, value: 'b' },
    ]);
  });

  it('an unmatched $ stays literal text', () => {
    expect(splitMath('costs $5 or so')).toEqual([{ math: false, value: 'costs $5 or so' }]);
  });

  it('empty $$ is not a math segment', () => {
    expect(splitMath('a $$ b')).toEqual([{ math: false, value: 'a $$ b' }]);
  });
});

describe('stripMath', () => {
  it('removes math, keeps prose', () => {
    expect(stripMath('form is $N(\\bar\\xi)$ indeed')).toBe('form is  indeed');
  });

  it('is the identity on plain prose', () => {
    expect(stripMath('no math here')).toBe('no math here');
  });
});
