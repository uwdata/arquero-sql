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
  if (typeof verb.size !== 'number') {
    // TODO: calculate the size -> then use the calculated size as limit
    throw new Error('sample only support constant sample size');
  }

  if (verb.options && verb.options.replace) {
    // TODO: create new table, randomly insert new comlumns into that table
    throw new Error('sample does not support replace');
  }

  const {groupby} = query._schema;

  return query
    .ungroup()
    .derive({[TMP_COL]: op.row_number()})
    ._wrap(
      c => c,
      schema => ({...schema, groupby}),
    )
    .orderby([() => op.random()])
    ._append(clauses => ({...clauses, limit: verb.size}))
    .orderby([TMP_COL])
    .select([not(TMP_COL)]);
}
