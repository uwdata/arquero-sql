/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import resolve from 'arquero/src/helpers/selection';
import isFunction from 'arquero/src/util/is-function';
import isNumber from 'arquero/src/util/is-number';

export const GB_KEY_PREFIX = '___arquero_sql_group_';
export const GB_KEY_SUFFIX = '___';
export const GB_KEY = key => GB_KEY_PREFIX + key + GB_KEY_SUFFIX;

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
    if (isFunction(key)) {
      // selection
      const sel = resolve(query, key);
      sel.forEach((v, k) => (_keys[GB_KEY(k)] = `d => d.${v}`));
    } else if (typeof key === 'object') {
      // derive
      Object.entries(key).forEach(([k, v]) => (_keys[GB_KEY(k)] = v));
    } else {
      // column
      key = isNumber(key) ? query.columnName(key) : key;
      _keys[GB_KEY(key)] = `d => d.${key}`;
    }
  });

  const groupby = Object.keys(_keys).map(key => key.substring(GB_KEY_PREFIX.length, key.length - GB_KEY_SUFFIX.length));
  return query.derive(_keys)._append(c => c, {...query._schema, groupby});
}
