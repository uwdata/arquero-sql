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
  verb = verb.toAST();
  if (verb.options && verb.options.replace) {
    throw new Error('sample does not support replace');
  }

  if (typeof verb.size !== 'number') {
    throw new Error('sample only support constant sample size');
  }

  return query
    .derive({[TMP_COL]: op.row_number()})
    .orderby([() => op.random()])
    ._append(clauses => ({...clauses, limit: verb.size}))
    .orderby([TMP_COL])
    .select([not(TMP_COL)]);
}
