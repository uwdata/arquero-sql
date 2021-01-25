/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import createColumn from '../utils/create-column';

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  verb = verb.toAST();
  const columns = new Map();
  (query._schema.groupby || []).forEach(name => columns.set(name, createColumn(name)));
  verb.values.forEach(value => columns.set(value.as || value.name, value));
  return query._wrap({select: [...columns.values()]}, {columns: [...columns.keys()]});
}
