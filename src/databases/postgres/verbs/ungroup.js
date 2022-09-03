/** @typedef { import('../pg-table-view').PostgresTableView} PostgresTableView */

/**
 *
 * @param {PostgresTableView} query
 */
export default function (query) {
  return query.isGrouped() ? query._wrap({columns: query.columnNames(), group: null}) : query;
}
