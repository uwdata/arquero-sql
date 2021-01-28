/** @typedef {import('../../node_modules/arquero/src/table/transformable').ListEntry} ListEntry */
/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {not, op} from 'arquero';

const TMP_COL = '___arquero_sql_temp_column_row_number___';

/**
 *
 * @param {SqlQuery} query
 * @param {ListEntry[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys = []) {
  return query
    .groupby(...(keys.length ? keys : query._schema.columns))
    .derive({[TMP_COL]: () => op.row_number()})
    .ungroup()
    .filter(`d => d.${TMP_COL} === 1`)
    .select(not(TMP_COL));
}
