/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {op} from 'arquero';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  const as = (verb.options && verb.options.as) || 'count';
  return query.rollup({[as]: () => op.count()});
}
