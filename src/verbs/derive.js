/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal} from 'arquero';
import error from 'arquero/src/util/error';
import createColumn from '../utils/create-column';
import {ARQUERO_WINDOW_FN} from '../visitors/gen-expr';
import hasFunction from '../visitors/has-function';
import {GB_KEY} from './groupby';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').ExprObject} values
 * @param {import('arquero/src/table/transformable').DeriveOptions} [options]
 * @returns {SqlQuery}
 */
export default function (query, values, options = {}) {
  if (Object.keys(options).length > 0) {
    error("Arquero-SQL does not support derive's option");
  }

  /** @type {Map<string, object>} */
  const columns = new Map();
  const {exprs, names} = internal.parse(values, {ast: true});
  query.columnNames().forEach(columnName => columns.set(columnName, createColumn(columnName)));
  exprs.forEach((expr, idx) => {
    /** @type {string} */
    const as = names[idx];
    columns.set(as, {...expr, as});
  });

  if (query.isGrouped()) {
    // eslint-disable-next-line no-console
    console.warn('Deriving with group may produce output with different ordering of rows');

    if ([...columns.values()].some(v => hasFunction(v, ARQUERO_WINDOW_FN))) {
      // eslint-disable-next-line no-console
      console.warn(
        'Deriving with window functions with group and without and explicit ordering may produce different result than Arquero',
      );
    }
  }

  let groupby_cols = [];
  if (query.isGrouped()) {
    groupby_cols = query._group.map(key => createColumn(GB_KEY(key)));
  }
  return query._wrap({
    clauses: {select: [...columns.values(), ...groupby_cols]},
    columns: [...columns.keys()],
  });
}
