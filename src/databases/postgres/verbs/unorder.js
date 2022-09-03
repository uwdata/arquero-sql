/** @typedef { import('../pg-db-table').PostgresDBTable} PostgresDBTable */

/**
 *
 * @param {PostgresDBTable} query
 */
export default function (query) {
  return query._order ? query._wrap({order: null}) : query;
}
