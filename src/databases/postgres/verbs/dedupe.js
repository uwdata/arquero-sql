/** @typedef {import('../pg-db-table').PostgresDBTable} PostgresDBTable */
/** @typedef {import('arquero/src/table/transformable').ListEntry} ListEntry */

import {not, op} from 'arquero';

const ROW_NUMBER = '___arquero_sql_row_number___';

/**
 *
 * @param {PostgresDBTable} query
 * @param {ListEntry[]} keys
 * @returns {PostgresDBTable}
 */
export default function (query, keys = []) {
  return query
    .groupby(...(keys.length ? keys : query.columnNames()))
    .filter(() => op.row_number() === 1)
    .ungroup()
    .select(not(ROW_NUMBER));
}
