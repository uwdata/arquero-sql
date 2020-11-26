import {genExp} from './visitors/gen-exp';

export function toSql(expr, tables) {
  return genExp(expr, tables);
}
