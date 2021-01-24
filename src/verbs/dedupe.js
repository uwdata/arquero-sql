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
  // TODO: use "WITH" when we have the support for "with" to reduce the amount of code generated
  query = query.derive({[TMP_COL]: () => op.row_number()});
  const dedupe = query.groupby(verb.keys).rollup({[TMP_COL]: `d => op.min(d.${TMP_COL})`});
  return query.join(dedupe, [TMP_COL, TMP_COL], [[not(TMP_COL)], []], {suffix: ['', '_2']});
}
