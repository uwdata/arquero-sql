/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {all, not, op} from 'arquero';

const TMP_COL = '___arquero_sql_temp_column_row_number___';

/**
 * 
 * @param {SqlQuery} query 
 * @param {Verb} verb 
 * @returns {SqlQuery}
 */
export default function(query, verb) {
  query = query.derive({[TMP_COL]: () => op.row_number()});
  const dedupe = query
    .groupby(verb.keys)
    .rollup({[TMP_COL]: `d => op.min(d.${TMP_COL})`});
  return query
    .join(dedupe, [TMP_COL, TMP_COL], [[all()], []], {suffix: ['', '_2']})
    .select([not(TMP_COL)]);
}