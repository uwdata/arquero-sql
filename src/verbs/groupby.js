/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

export const GB_KEY_PREFIX = '___arquero_sql_groupby_key_';
export const GB_KEY_SUFFIX = '___';
const GB_KEY = key => GB_KEY_PREFIX + key + GB_KEY_SUFFIX;
const TMP_KEY = i => GB_KEY('gb_tmp_' + i);

function warn(key) {
  // eslint-disable-next-line no-console
  console.warn(`a group-by key "${key}" will be added to the final table`);
}

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  if (query.isGrouped()) {
    query = query.ungroup();
  }

  const keys = {};
  let idx = 0;
  verb.keys.forEach(key => {
    if (typeof key === 'function') {
      warn(TMP_KEY(idx));
      keys[TMP_KEY(idx++)] = key;
    } else if (typeof key === 'object') {
      Object.entries(key).forEach((k, v) => (keys[GB_KEY(k)] = v));
    } else {
      keys[GB_KEY(key)] = `d => d.${key}`;
    }
  });

  const groupby = Object.values(keys);
  return query.derive(keys)._append(
    c => c,
    s => ({columns: s.columns.slice(0, -groupby.length), groupby}),
  );
}
