/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../pg-table-view').PostgresTableView} PostgresTableView */

import {internal, not} from 'arquero';
import {ARQUERO_AGGREGATION_FN, ARQUERO_WINDOW_FN} from '../visitors/gen-expr';
import hasFunction from '../visitors/has-function';

const TMP_COL = '___arquero_sql_predicate___';

/**
 *
 * @param {PostgresTableView} table
 * @param {import('arquero/dist/types/table/transformable').TableExpr|string} criteria
 * @returns {PostgresTableView}
 */
export default function (table, criteria) {
  const _criteria = internal.parse({p: criteria}, {ast: true}).exprs[0];

  if (!hasFunction(_criteria, [...ARQUERO_AGGREGATION_FN, ...ARQUERO_WINDOW_FN])) {
    return table._wrap({clauses: {where: [_criteria]}});
  }

  return table
    .derive({[TMP_COL]: criteria})
    .filter(`d => d.${TMP_COL}`)
    .select(not(TMP_COL));
}
