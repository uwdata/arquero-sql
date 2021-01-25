/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {aggregatedColumns} from '../visitors/aggregated-columns';
import {columns} from '../visitors/columns';
import {hasAggregation} from '../visitors/has-aggregation';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  verb = verb.toAST();
  const {predicate} = verb;

  if (!hasAggregation(predicate)) {
    return query._wrap({where: predicate});
  }

  const c = new Set(columns(predicate));
  const a = new Set(aggregatedColumns(predicate));
  const na = new Set([...c].filter(x => !a.has(x)));

  // NOTE: no cases ?
  if (query.isGrouped()) {
    if (na.size() === 0) {
      // TODO: join with aggregated groupby query (with temp columns for all the aggregation) (join by group-by keys)
      // use where clause to filter
      // select not aggregated temp columns
    }
    // TODO: join with aggregated groupby query (with temp columns for all the aggregation) (join by group-by keys)
    // use where clause to filter
    // select not aggregated temp columns
  }

  if (na.size() === 0) {
    // TODO:
  }
  // TODO:
}
