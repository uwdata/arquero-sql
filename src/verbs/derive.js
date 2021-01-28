/** @typedef {import('../../node_modules/arquero/src/table/transformable').ExprObject} ExprObject */
/** @typedef {import('../../node_modules/arquero/src/table/transformable').DeriveOptions} DeriveOptions */
/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal} from 'arquero';
import createColumn from '../utils/create-column';

/**
 *
 * @param {SqlQuery} query
 * @param {ExprObject} values
 * @param {DeriveOptions} [options]
 * @returns {SqlQuery}
 */
export default function (query, values, options = {}) {
  // TODO: use Arquero's parse
  const verb = internal.Verbs.derive(values, options).toAST();
  /** @type {Map<string, object>} */
  const columns = new Map();
  verb.values.forEach(value => columns.set(value.as || value.name, value));

  let groupby_cols = [];
  if (query.isGrouped()) {
    groupby_cols = query._schema.groupby.map(key => createColumn(key));
  }
  return query._wrap({select: [...columns.values(), ...groupby_cols]}, s => ({...s, columns: [...columns.keys()]}));
}
