/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../pg-table-view').PostgresTableView} PostgresTableView */

import resolve from 'arquero/src/helpers/selection';
import isFunction from 'arquero/src/util/is-function';
import isNumber from 'arquero/src/util/is-number';

export const GB_KEY_PREFIX = '___arquero_sql_group_';
export const GB_KEY_SUFFIX = '___';
export const GB_KEY = key => GB_KEY_PREFIX + key + GB_KEY_SUFFIX;

/**
 *
 * @param {PostgresTableView} table
 * @param {import('arquero/src/table/transformable').ListEntry[]} values
 * @returns {PostgresTableView}
 */
export default function (table, values) {
  if (table.isGrouped()) {
    table = table.ungroup();
  }

  // TODO: use Arquero's parse function?

  const _keys = {};
  values.forEach(key => {
    if (isFunction(key)) {
      // selection
      const sel = resolve(table, key);
      sel.forEach((v, k) => (_keys[GB_KEY(k)] = `d => d["${v}"]`));
    } else if (typeof key === 'object') {
      // derive
      Object.entries(key).forEach(([k, v]) => (_keys[GB_KEY(k)] = v));
    } else {
      // column
      key = isNumber(key) ? table.columnName(key) : key;
      _keys[GB_KEY(key)] = `d => d["${key}"]`;
    }
  });

  const group = Object.keys(_keys).map(key => key.substring(GB_KEY_PREFIX.length, key.length - GB_KEY_SUFFIX.length));
  return table.derive(_keys)._append({group, columns: table.columnNames()});
}
