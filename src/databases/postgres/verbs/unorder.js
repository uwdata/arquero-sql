/** @typedef { import('../pg-table-view').PostgresTableView} PostgresTableView */

/**
 *
 * @param {PostgresTableView} table
 */
export default function (table) {
  return table._order ? table._wrap({order: null}) : table;
}
