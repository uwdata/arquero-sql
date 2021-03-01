/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {op} from 'arquero';

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

  // eslint-disable-next-line no-console
  console.warn('Sampling will produce output with different ordering of rows');
  return query
    .orderby([() => op.random()])
    ._append({clauses: c => ({...c, limit: size})})
    .unorder();
}
