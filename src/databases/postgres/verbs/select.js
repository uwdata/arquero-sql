/** @typedef { import('../pg-table-view').PostgresTableView } PostgresTableView */
/** @typedef { import('../utils/create-column').ColumnType } ColumnType */
/** @typedef { import('./common').Verb } Verb */

import createColumn from '../utils/create-column';
import resolve from 'arquero/src/helpers/selection';
import isString from 'arquero/src/util/is-string';
import {GB_KEY} from './groupby';

/**
 *
 * @param {PostgresTableView} table
 * @param {import('arquero/src/table/transformable').SelectEntry[]} columns
 * @returns {PostgresTableView}
 */
export default function (table, columns) {
  /** @type {ColumnType[]} */
  const cols = [];
  resolve(table, columns).forEach((next, curr) => {
    next = isString(next) ? next : curr;
    if (next) {
      if (!table._columns.includes(curr)) {
        throw new Error(`Unrecognized column: ${curr}`);
      }
      cols.push(createColumn(curr, next));
    }
  });

  let groupby_cols = [];
  if (table.isGrouped()) {
    groupby_cols = table._group.map(key => createColumn(GB_KEY(key)));
  }

  return table._wrap({
    clauses: {select: [...cols, ...groupby_cols]},
    columns: cols.map(col => col.as || col.name),
  });
}
