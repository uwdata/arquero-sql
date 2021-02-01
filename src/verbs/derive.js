/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal} from 'arquero';
import createColumn from '../utils/create-column';
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
    console.warn("TODO: support derive's option");
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

  let groupby_cols = [];
  if (query.isGrouped()) {
    groupby_cols = query._schema.groupby.map(key => createColumn(GB_KEY(key)));
  }
  return query._wrap({select: [...columns.values(), ...groupby_cols]}, s => ({...s, columns: [...columns.keys()]}));
}
