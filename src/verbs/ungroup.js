/** @typedef { import('../sql-query').SqlQuery} SqlQuery */

/**
 *
 * @param {SqlQuery} query
 */
export default function (query) {
  return query.isGrouped() ? query._wrap({columns: query.columnNames(), group: null}) : query;
}
