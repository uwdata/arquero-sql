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
  /** @type {Map<string, object>} */
  const columns = new Map();
  verb.values.forEach(value => columns.set(value.as || value.name, value));

  let groupby_cols = [];
  if (query.isGrouped()) {
    groupby_cols = query._schema.groupby.map(key => createColumn(key));
  }
  return query._wrap({select: [...columns.values(), ...groupby_cols]}, s => ({...s, columns: [...columns.keys()]}));
}
