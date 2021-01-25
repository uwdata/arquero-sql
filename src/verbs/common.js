/** @typedef {import('arquero').internal.Table} Table */

import {SqlQuery} from '../sql-query';
import createColumn from '../utils/create-column';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export function combine(query, verb) {
  verb = verb.toAST();

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

  return query._wrap({select, [verb.verb]: tables});
}

/**
 * @typedef {object} Verb Arquero's verb object
 * @prop {string} verb
 * @prop {object} schema
 * @prop {(table: Table, catalog: Function) => Table} evaluate
 * @prop {() => object} toObject
 * @prop {() => object} toAST
 */
