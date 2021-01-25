/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {not} from 'arquero';
import {hasAggregation} from '../visitors/has-aggregation';

const TMP_COL = '___arquero_sql_temp_column_filter___';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  const _verb = verb.toAST();
  const {predicate} = _verb;

  if (!hasAggregation(predicate)) {
    return query._wrap({where: [predicate]});
  }

  return query
    .derive({[TMP_COL]: verb.criteria})
    .filter(`d => d.${TMP_COL}`)
    .select(not(TMP_COL));
}
