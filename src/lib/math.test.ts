import { describe, expect, it } from 'vitest';
import { parseStatement, stripMath } from './math';

const prose = (segments: unknown) => [{ kind: 'prose', segments }];

describe('parseStatement', () => {
  it('plain prose is one text segment', () => {
    expect(parseStatement('The world is everything that is the case.')).toEqual(
      prose([{ kind: 'text', value: 'The world is everything that is the case.' }]),
    );
  });

  it('extracts a $…$ segment between prose', () => {
    expect(parseStatement('form is $[\\bar p]$ here.')).toEqual(
      prose([
        { kind: 'text', value: 'form is ' },
        { kind: 'math', display: false, value: '[\\bar p]' },
        { kind: 'text', value: ' here.' },
      ]),
    );
  });

  it('recognizes $$…$$ display math', () => {
    expect(parseStatement('see $$x=1$$')).toEqual(
      prose([
        { kind: 'text', value: 'see ' },
        { kind: 'math', display: true, value: 'x=1' },
      ]),
    );
  });

  it('unwraps \\emph{…} as an emphasis segment', () => {
    expect(parseStatement('an \\emph{atomic} fact')).toEqual(
      prose([
        { kind: 'text', value: 'an ' },
        { kind: 'emph', value: 'atomic' },
        { kind: 'text', value: ' fact' },
      ]),
    );
  });

  it('an unmatched $ stays literal text', () => {
    expect(parseStatement('costs $5 or so')).toEqual(
      prose([{ kind: 'text', value: 'costs $5 or so' }]),
    );
  });

  it('splits blank-line paragraphs', () => {
    expect(parseStatement('one.\n\ntwo.')).toEqual([
      { kind: 'prose', segments: [{ kind: 'text', value: 'one.' }] },
      { kind: 'prose', segments: [{ kind: 'text', value: 'two.' }] },
    ]);
  });

  it('reads a [[block:ID]] paragraph as a block', () => {
    expect(parseStatement('lead\n\n[[block:5.101]]\n\ntail')).toEqual([
      { kind: 'prose', segments: [{ kind: 'text', value: 'lead' }] },
      { kind: 'block', id: '5.101' },
      { kind: 'prose', segments: [{ kind: 'text', value: 'tail' }] },
    ]);
  });
});

describe('stripMath', () => {
  it('removes math, keeps prose', () => {
    expect(stripMath('form is $N(\\bar\\xi)$ indeed')).toBe('form is  indeed');
  });

  it('is the identity on plain prose', () => {
    expect(stripMath('no math here')).toBe('no math here');
  });

  it('keeps emphasized words but drops display math and blocks', () => {
    expect(stripMath('an \\emph{atomic} fact\n\n[[block:5.101]]\n\n$$x=1$$ end')).toBe(
      'an atomic fact   end',
    );
  });
});
