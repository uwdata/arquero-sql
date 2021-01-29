/** @typedef { import('arquero/dist/types/table/transformable').SelectEntry } SelectEntry */
/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('../utils/create-column').ColumnType } ColumnType */
/** @typedef { import('./common').Verb } Verb */

import {internal} from 'arquero';
import createColumn from '../utils/create-column';
import resolve from './expr/selection';

/**
 *
 * @param {SqlQuery} query
 * @param {SelectEntry[]} columns
 * @returns {SqlQuery}
 */
export default function (query, columns) {
  const verb = internal.Verbs.select(columns).toAST();

  if (!query._schema && verb.columns.some(column => column.type === 'Selection')) {
    throw new Error('Cannot select with selection function(s) without schema');
  }

  /** @type {ColumnType[]} */
  const cols = [];
  resolve(query, verb.columns).forEach((value, curr) => {
    const next = typeof value === 'string' ? value : curr;
    if (next) {
      if (query._schema && query._schema.columns && query._schema.columns.indexOf(curr) === -1) {
        throw new Error(`Unrecognized column: ${curr}`);
      }
      cols.push(createColumn(curr, next));
    }
  });

  let groupby_cols = [];
  if (query.isGrouped()) {
    groupby_cols = query._schema.groupby.map(key => createColumn(key));
  }

  return query._wrap({select: [...cols, ...groupby_cols]}, {columns: cols.map(col => col.as || col.name)});
}
