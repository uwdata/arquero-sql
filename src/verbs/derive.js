/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import hasAggregation from '../visitors/has-aggregation';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
// eslint-disable-next-line no-unused-vars
export default function (query, verb) {
  verb = verb.toAST();

  if (verb.values.some(d => hasAggregation(d))) {
    throw new Error('Derive does not allow aggregated operations');
  }
}
