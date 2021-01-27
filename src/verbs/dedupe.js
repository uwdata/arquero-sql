/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {not, op} from 'arquero';

const TMP_COL = '___arquero_sql_temp_column_row_number___';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  return query
    .groupby(verb.keys)
    .derive({[TMP_COL]: () => op.row_number()})
    .ungroup()
    .filter(`d => d.${TMP_COL} === 1`)
    .select(not(TMP_COL));
}
