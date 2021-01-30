/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {not, op} from 'arquero';

const TMP_COL = '___arquero_sql_temp_column_row_number___';

/**
 *
 * @param {SqlQuery} query
 * @param {number|import('arquero/src/table/transformable').TableExpr} size
 * @param {import('arquero/src/table/transformable').SampleOptions} options
 * @returns {SqlQuery}
 */
export default function (query, size, options = {}) {
  if (typeof size !== 'number') {
    // TODO: calculate the size -> then use the calculated size as limit
    throw new Error('sample only support constant sample size');
  }

  if (options.replace) {
    // TODO: create new table, randomly insert new comlumns into that table
    throw new Error("Arquero-SQL's sample does not support replace");
  }

  if (options.weight) {
    throw new Error("Arquero-SQL's sample does not support weight");
  }

  const {groupby} = query._schema;

  return (
    query
      .ungroup()
      // TODO: need a better way to get the row number without ungroup then group
      .derive({[TMP_COL]: () => op.row_number()})
      ._wrap(
        c => c,
        schema => ({...schema, groupby}),
      )
      .orderby([() => op.random()])
      ._append(clauses => ({...clauses, limit: size}))
      .orderby([TMP_COL])
      .select([not(TMP_COL)])
  );
}
