/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('./common').Verb} Verb */

import {internal} from 'arquero';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').OrderKey[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys) {
  return query._wrap({orderby: internal.Verbs.orderby(keys).toAST().keys});
}
