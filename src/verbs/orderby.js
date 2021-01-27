/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('./common').Verb} Verb */

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  // TODO: if the order keys contains aggregated columns,
  // need to extract the aggregated column to be calculated
  // in other table, then join. Then, remove the columns.
  return query._wrap({orderby: verb.toAST().keys});
}
