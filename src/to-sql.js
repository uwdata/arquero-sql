import {genExpr} from './visitors/gen-expr';

export function toSql(expr, tables) {
  return genExpr(expr, tables);
}
