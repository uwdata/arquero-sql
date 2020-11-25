import {visit} from './visitors';

export function toSql(expr, tables) {
  return visit(expr, tables);
}
