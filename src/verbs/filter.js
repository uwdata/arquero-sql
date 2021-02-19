/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal, not} from 'arquero';
import {ARQUERO_AGGREGATION_FN, ARQUERO_WINDOW_FN} from '../visitors/gen-expr';
import hasFunction from '../visitors/has-function';

const TMP_COL = '___arquero_sql_predicate___';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/dist/types/table/transformable').TableExpr|string} criteria
 * @returns {SqlQuery}
 */
export default function (query, criteria) {
  const _criteria = internal.parse({p: criteria}, {ast: true}).exprs[0];

  if (!hasFunction(_criteria, [...ARQUERO_AGGREGATION_FN, ...ARQUERO_WINDOW_FN])) {
    return query._wrap({clauses: {where: [_criteria]}});
  }

  return query
    .derive({[TMP_COL]: criteria})
    .filter(`d => d.${TMP_COL}`)
    .select(not(TMP_COL));
}
