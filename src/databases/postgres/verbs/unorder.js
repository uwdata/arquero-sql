/** @typedef { import('../pg-query-builder').PostgresQueryBuilder} PostgresQueryBuilder */

/**
 *
 * @param {PostgresQueryBuilder} query
 */
export default function (query) {
  return query._order ? query._wrap({order: null}) : query;
}
