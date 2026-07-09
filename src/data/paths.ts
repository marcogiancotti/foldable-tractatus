/*
  Curated reading paths — named preset pin-sets (spec §11).
  Authored against the current 25-node subset; re-author alongside the full text.
*/

export interface ReadingPath {
  id: string;
  name: string;
  pins: string[];
}

export const READING_PATHS: ReadingPath[] = [
  {
    id: 'picture-theory',
    name: 'Picture theory',
    pins: ['2.1', '2.11', '2.12', '2.13', '2.14', '2.141', '3.01'],
  },
  {
    id: 'world-and-facts',
    name: 'World & facts',
    pins: ['1.1', '1.11', '1.13', '1.2', '2'],
  },
  {
    id: 'the-ladder',
    name: 'The ladder',
    pins: ['6', '7'],
  },
];

export const pathById = new Map(READING_PATHS.map((p) => [p.id, p]));
