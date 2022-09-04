/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../pg-table-view').PostgresTableView} PostgresTableView */

import {internal} from 'arquero';
import error from 'arquero/src/util/error';
import createColumn from '../utils/create-column';
import {ARQUERO_WINDOW_FN} from '../visitors/gen-expr';
import hasFunction from '../visitors/has-function';
import {GB_KEY} from './groupby';

/**
 *
 * @param {PostgresTableView} table
 * @param {import('arquero/src/table/transformable').ExprObject} [values]
 * @returns {PostgresTableView}
 */
export default function (table, values = []) {
  /** @type {Map<string, object>} */
  const columns = new Map();
  if (table.isGrouped()) {
    table._group.forEach(key => columns.set(key, createColumn(GB_KEY(key), key)));
  }

  const {exprs, names} = internal.parse(values, {ast: true, argonly: true});
  exprs.forEach((expr, idx) => {
    if (hasFunction(expr, ARQUERO_WINDOW_FN)) {
      error('Cannot rollup an expression containing a window fundtion');
    }

    const as = names[idx];
    columns.set(as, {...expr, as});
  });

  return table._wrap({
    clauses: {
      select: [...columns.values()],
      groupby: !table.isGrouped() || table._group.map(g => createColumn(GB_KEY(g))),
    },
    columns: [...columns.keys()],
    group: null,
  });
}
