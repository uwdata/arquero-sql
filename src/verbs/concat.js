/** @typedef { import('../utils').ColumnType } ColumnType */

import {SqlQuery} from '../sql-query';
import {createColumn} from '../utils';

/**
 *
 * @param {SqlQuery} query
 * @param {{tables: any[]}} verb
 */
export default function (query, verb) {
  const {tables} = verb;
  const select = query._schema.columns.map(col => createColumn(col));
  const concat = tables.map(table => {
    if (table instanceof SqlQuery) {
      return table;
    } else if (typeof table === 'string') {
      return new SqlQuery(table);
    } else {
      throw new Error('Table must be a string or SqlQuery');
    }
  });

  return query._wrap({select, concat}, query._schema);
}
