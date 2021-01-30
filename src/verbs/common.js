/** @typedef {import('arquero').internal.Table} Table */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {sqlQuery} from '../sql-query';
import createColumn from '../utils/create-column';

/**
 *
 * @param {'concat' | 'except' | 'intersect' | 'union'} verb
 * @returns {(query: SqlQuery, others: (SqlQuery|string)[]) => SqlQuery}
 */
export function set_verb(verb) {
  return (query, others) => {
    const select = query._schema.columns.map(col => createColumn(col));
    const tables = others.map(sqlQuery);
    return query._wrap({select, [verb]: tables});
  };
}

/**
 * @typedef {object} Verb Arquero's verb object
 * @prop {string} verb
 * @prop {object} schema
 * @prop {(table: Table, catalog: Function) => Table} evaluate
 * @prop {() => object} toObject
 * @prop {() => object} toAST
 */
