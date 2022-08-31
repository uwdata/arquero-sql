/** @typedef { import('../pg-query-builder').PostgresQueryBuilder} PostgresQueryBuilder */

/**
 *
 * @param {PostgresQueryBuilder} query
 */
export default function (query) {
  return query.isGrouped() ? query._wrap({columns: query.columnNames(), group: null}) : query;
}
