/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal} from 'arquero';
import resolve from './expr/selection';

export const GB_KEY_PREFIX = '___arquero_sql_groupby_key_';
export const GB_KEY_SUFFIX = '___';
const GB_KEY = key => GB_KEY_PREFIX + key + GB_KEY_SUFFIX;

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').ListEntry[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys) {
  if (query.isGrouped()) {
    query = query.ungroup();
  }

  const _keys = {};
  keys.forEach(key => {
    if (typeof key === 'function') {
      // selection
      const {columns} = internal.Verbs.select([key]).toAST();
      const sel = resolve(query, columns);
      sel.forEach((v, k) => (_keys[GB_KEY(k)] = `d => d.${v}`));
    } else if (typeof key === 'object') {
      // derive
      Object.entries(key).forEach(([k, v]) => (_keys[GB_KEY(k)] = v));
    } else {
      // column
      _keys[GB_KEY(key)] = `d => d.${key}`;
    }
  });

  const groupby = Object.values(_keys);
  return query.derive(_keys)._append(c => c, {...query._schema, groupby});
}
