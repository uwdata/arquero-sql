/** @typedef {import('arquero/dist/types/table/transformable').TableExpr} TableExpr */
/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal, not} from 'arquero';
import {hasAggregation} from '../visitors/has-aggregation';

const TMP_COL = '___arquero_sql_temp_column_filter___';

/**
 *
 * @param {SqlQuery} query
 * @param {TableExpr|string} criteria
 * @returns {SqlQuery}
 */
export default function (query, criteria) {
  const verb = internal.Verbs.filter(criteria).toAST();
  const {predicate} = verb;

  if (!hasAggregation(predicate)) {
    return query._wrap({where: [predicate]});
  }

  return query
    .derive({[TMP_COL]: criteria})
    .filter(`d => d.${TMP_COL}`)
    .select(not(TMP_COL));
}
