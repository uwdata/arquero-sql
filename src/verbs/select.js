/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('../utils').ColumnType } ColumnType */

import { createColumn } from '../utils';
import resolve from './expr/selection';

/**
 * 
 * @param {SqlQuery} query 
 * @param {object} verb 
 */
export default function(query, verb) {
  if (!query._schema && verb.columns.some(column => column.type === 'Selection')) {
    throw new Error("Cannot select with selection function(s) without schema");
  }

  /** @type {ColumnType[]} */
  const cols = [];
  const columns = resolve(query, verb.columns);
  columns.forEach((value, curr) => {
    const next = typeof value === 'string' ? value : curr;
    if (next) {
      const col = !('_schema' in query) || query._schema?.columns.indexOf(curr) !== -1
        ? createColumn(curr, next)
        : error(`Unrecognized column: ${curr}`);
      cols.push(col);
    }
  });

  return query._wrap(
    {select: cols},
    {columns: cols.map(col => col.as || col.name)},
  )
}