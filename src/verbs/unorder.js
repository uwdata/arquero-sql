/** @typedef { import('../sql-query').SqlQuery} SqlQuery */

/**
 *
 * @param {SqlQuery} query
 */
export default function (query) {
  return query._order ? query._wrap({order: null}) : query;
}
