/** @typedef {import('../sql-query').SqlQuery} SqlQuery */
/** @typedef {import('arquero/src/table/transformable').ListEntry} ListEntry */

import {op} from 'arquero';

/**
 *
 * @param {SqlQuery} query
 * @param {ListEntry[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys = []) {
  return query
    .groupby(...(keys.length ? keys : query.columnNames()))
    .filter(() => op.row_number() === 1)
    .ungroup();
}
