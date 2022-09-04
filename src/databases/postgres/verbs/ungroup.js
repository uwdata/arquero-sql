/** @typedef { import('../pg-table-view').PostgresTableView} PostgresTableView */

/**
 *
 * @param {PostgresTableView} table
 */
export default function (table) {
  return table.isGrouped() ? table._wrap({columns: table.columnNames(), group: null}) : table;
}
