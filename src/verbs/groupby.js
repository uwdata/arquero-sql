/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

const TMP_KEY = i => `___arquero_sql_temp_key_${i}___`;

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
  const _verb = verb.toAST();
  const keys = {};
  let idx = 0;
  verb.keys.forEach(key => {
    if (typeof key === 'function') {
      warn(TMP_KEY(idx));
      keys[TMP_KEY(idx++)] = key;
    } else if (typeof key === 'object') {
      const keys = Object.keys(key);
      keys.forEach(warn);
      idx += keys.length;
      Object.assign(keys, key);
    } else {
      idx++;
    }
  });
  return query.derive(keys)._append(
    c => c,
    s => ({...s, groupby: _verb.keys.map((key, idx) => key.as || key.name || TMP_KEY(idx))}),
  );
}
