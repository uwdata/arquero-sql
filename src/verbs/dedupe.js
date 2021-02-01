/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {not, op} from 'arquero';

const TMP_COL = '___arquero_sql_temp_column_row_number___';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').ListEntry[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys = []) {
  return query
    .ungroup()
    .groupby(...(keys.length ? keys : query.columnNames()))
    .derive({[TMP_COL]: () => op.row_number()})
    .ungroup()
    .filter(`d => d.${TMP_COL} === 1`)
    .select(not(TMP_COL));
}
