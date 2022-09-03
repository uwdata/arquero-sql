/** @typedef { import('../pg-db-table').PostgresDBTable} PostgresDBTable */

/**
 *
 * @param {PostgresDBTable} query
 */
export default function (query) {
  return query.isGrouped() ? query._wrap({columns: query.columnNames(), group: null}) : query;
}
