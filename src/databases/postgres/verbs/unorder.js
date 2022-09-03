/** @typedef { import('../pg-table-view').PostgresTableView} PostgresTableView */

/**
 *
 * @param {PostgresTableView} query
 */
export default function (query) {
  return query._order ? query._wrap({order: null}) : query;
}
