/** @typedef {import('arquero').internal.Table} Table */
/** @typedef {import('../pg-table-view').PostgresTableView} PostgresTableView */

import createColumn from '../utils/create-column';

/**
 *
 * @param {'concat' | 'except' | 'intersect' | 'union'} verb
 * @returns {(query: PostgresTableView, others: PostgresTableView[]) => PostgresTableView}
 */
export function set_verb(verb) {
  return (table, others) => {
    const select = table.columnNames().map(col => createColumn(col));
    const tables = others.map(other => other.ungroup());
    return table.ungroup()._wrap({clauses: {select, [verb]: tables}});
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
