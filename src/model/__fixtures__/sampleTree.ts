/*
  Frozen 25-node subset (the original curated data) used as a stable fixture for
  the model tests, so their assertions about derivation shape and match counts
  don't depend on the full ~526-statement text. Do not extend — it exists only
  to pin the tests to a known small tree. See src/model/tree.ts `buildTree`.
*/

import type { StatementSource } from '../../data/tractatus';

export const SAMPLE_TREE: StatementSource[] = [
  {
    n: '1',
    text: 'The world is everything that is the case.',
    children: [
      {
        n: '1.1',
        text: 'The world is the totality of facts, not of things.',
        refs: ['1.11'],
        children: [
          { n: '1.11', text: 'The world is determined by the facts, and by these being all the facts.' },
          { n: '1.12', text: 'For the totality of facts determines both what is the case, and also all that is not the case.' },
          { n: '1.13', text: 'The facts in logical space are the world.' },
        ],
      },
      {
        n: '1.2',
        text: 'The world divides into facts.',
        children: [
          { n: '1.21', text: 'Any one can either be the case or not be the case, and everything else remain the same.' },
        ],
      },
    ],
  },
  {
    n: '2',
    text: 'What is the case, the fact, is the existence of atomic facts.',
    children: [
      {
        n: '2.01',
        text: 'An atomic fact is a combination of objects (entities, things).',
        children: [
          { n: '2.011', text: 'It is essential to a thing that it can be a constituent part of an atomic fact.' },
          { n: '2.012', text: 'In logic nothing is accidental: if a thing can occur in an atomic fact the possibility of that atomic fact must already be prejudged in the thing.' },
        ],
      },
      { n: '2.02', text: 'The object is simple.' },
      {
        n: '2.1',
        text: 'We make to ourselves pictures of facts.',
        children: [
          { n: '2.11', text: 'The picture presents the facts in logical space, the existence and non-existence of atomic facts.', refs: ['2.14'] },
          { n: '2.12', text: 'The picture is a model of reality.', refs: ['2.1'] },
          { n: '2.13', text: 'To the objects correspond in the picture the elements of the picture.' },
          {
            n: '2.14',
            text: 'The picture consists in the fact that its elements are combined with one another in a definite way.',
            children: [{ n: '2.141', text: 'The picture is a fact.' }],
          },
        ],
      },
    ],
  },
  {
    n: '3',
    text: 'The logical picture of the facts is the thought.',
    children: [
      { n: '3.001', text: '"An atomic fact is thinkable"—means: we can imagine it.', refs: ['2.01'] },
      { n: '3.01', text: 'The totality of true thoughts is a picture of the world.', refs: ['2.1'] },
    ],
  },
  { n: '4', text: 'The thought is the significant proposition.' },
  { n: '5', text: 'Propositions are truth-functions of elementary propositions.' },
  { n: '6', text: 'The general form of truth-function is $[\\bar p, \\bar \\xi, N(\\bar \\xi)]$.' },
  { n: '7', text: 'Whereof one cannot speak, thereof one must be silent.' },
];
