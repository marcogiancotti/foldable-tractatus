/*
  Curated reading paths — named preset pin-sets (spec §11).

  Each path is a cross-section the secondary literature treats as a unit, cut so
  that it reads badly in book order and well as a focused view. Themes and their
  constituent propositions follow the standard mappings in the Stanford
  Encyclopedia entries on Wittgenstein and on his logical atomism, the IEP entry,
  and the topic divisions common to university courses on the Tractatus
  (e.g. UMass Phil 791T, Edinburgh PHIL10014).

  5.62 appears in two paths on purpose: it is both the solipsism thesis and the
  canonical statement that what solipsism means cannot be said, only shown.
*/

export interface ReadingPath {
  id: string;
  name: string;
  pins: string[];
}

export const READING_PATHS: ReadingPath[] = [
  {
    // How a proposition can be true or false at all: a picture models reality,
    // shares logical form with it, and stands or falls by comparison with it.
    id: 'picture-theory',
    name: 'Picture theory',
    pins: [
      '2.1', '2.11', '2.12', '2.15', '2.161', '2.17', '2.18',
      '2.201', '2.21', '2.223', '3', '4.01', '4.021', '4.06',
    ],
  },
  {
    // The distinction Wittgenstein called the main point of the book. Its
    // members are scattered across six decimal branches — the path exists to be
    // assembled, not scrolled to.
    id: 'saying-showing',
    name: 'Saying and showing',
    pins: [
      '3.332', '4.022', '4.0312', '4.121', '4.1212', '4.122',
      '4.126', '5.62', '6.113', '6.124', '6.522',
    ],
  },
  {
    // The hinge where the logical apparatus turns into the ethical conclusion:
    // the subject as limit rather than part of the world, through to death not
    // being an event in life.
    id: 'limits-of-my-world',
    name: 'The limits of my world',
    pins: [
      '5.6', '5.61', '5.62', '5.621', '5.63', '5.631', '5.632',
      '5.633', '5.634', '5.64', '5.641', '6.431', '6.4311', '6.4312',
    ],
  },
];

export const pathById = new Map(READING_PATHS.map((p) => [p.id, p]));
