/*
  Figure/table block registry. Statement text embeds `[[block:ID]]` sentinels
  (see src/lib/math.ts); BlockView renders the matching component. Unknown ids
  render nothing, so the text stays robust if data and components drift.
*/

import { Table4_31, Table4_442, Table5_101 } from './Tables';
import {
  AbFigure1,
  AbFigure2,
  AbFigure3,
  AbFigure4,
  AbFigure5,
  Cube,
  Eye,
  Line,
} from './Figures';

export const BLOCKS: Record<string, () => React.ReactElement> = {
  '4.31': Table4_31,
  '4.442': Table4_442,
  '5.101': Table5_101,
  '5.5423': Cube,
  '5.6331': Eye,
  '6.36111': Line,
  '6.1203.1': AbFigure1,
  '6.1203.2': AbFigure2,
  '6.1203.3': AbFigure3,
  '6.1203.4': AbFigure4,
  '6.1203.5': AbFigure5,
};

export function BlockView({ id }: { id: string }) {
  const Block = BLOCKS[id];
  return Block ? <Block /> : null;
}
