/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  const _verb = verb.toAST();
  const keys = verb.keys.filter(key => typeof key !== 'string').reduce((acc, key) => ({...acc, ...key}), {});
  return query.derive(keys)._append(
    c => c,
    s => ({...s, groupby: _verb.keys.map(key => key.as || key.name)}),
  );
}
