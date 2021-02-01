/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('../utils/create-column').ColumnType } ColumnType */
/** @typedef { import('./common').Verb } Verb */

import createColumn from '../utils/create-column';
import resolve from 'arquero/src/helpers/selection';
import isString from 'arquero/src/util/is-string';
import {GB_KEY} from './groupby';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').SelectEntry[]} columns
 * @returns {SqlQuery}
 */
export default function (query, columns) {
  /** @type {ColumnType[]} */
  const cols = [];
  resolve(query, columns).forEach((curr, next) => {
    next = isString(next) ? next : curr;
    if (next) {
      if (!query._schema.columns.includes(curr)) {
        throw new Error(`Unrecognized column: ${curr}`);
      }
      cols.push(createColumn(curr, next));
    }
  });

  let groupby_cols = [];
  if (query.isGrouped()) {
    groupby_cols = query._schema.groupby.map(key => createColumn(GB_KEY(key)));
  }

  return query._wrap({select: [...cols, ...groupby_cols]}, {columns: cols.map(col => col.as || col.name)});
}
