/** @typedef {import('../sql-query').SqlQuery} SqlQuery */
/** @typedef {import('arquero/src/table/transformable').ListEntry} ListEntry */

import {not, op} from 'arquero';

const ROW_NUMBER = '___arquero_sql_row_number___';

/**
 *
 * @param {SqlQuery} query
 * @param {ListEntry[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys = []) {
  return query
    .derive({[ROW_NUMBER]: () => op.row_number()})
    .groupby(...(keys.length ? keys : query.columnNames()))
    .orderby(ROW_NUMBER)
    .filter(() => op.row_number() === 1)
    .unorder()
    .ungroup()
    .select(not(ROW_NUMBER));
}
