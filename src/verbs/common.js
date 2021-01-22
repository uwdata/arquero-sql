import {SqlQuery} from './sql-query';
import {createColumn} from '../utils';

/**
 * 
 * @param {SqlQuery} query 
 * @param {object} verb 
 * @returns {SqlQuery}
 */
export function combine(query, verb) {
  const select = query._schema.columns.map(col => createColumn(col));
  const tables = verb.tables.map(table => {
    if (table instanceof SqlQuery) {
      return table;
    } else if (typeof table === 'string') {
      return new SqlQuery(table);
    } else {
      throw new Error('Table must be a string or SqlQuery');
    }
  });

  return query._wrap({select, [verb.verb]: tables}, query._schema);
}