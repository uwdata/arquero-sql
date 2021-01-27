/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import createColumn from '../utils/create-column';
import {GB_KEY_PREFIX, GB_KEY_SUFFIX} from './groupby';

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
  if (query.isGrouped()) {
    query._schema.groupby.forEach(key => {
      const next = key.slice(GB_KEY_PREFIX.length, -GB_KEY_SUFFIX.length);
      columns.set(next, createColumn(key, next));
    });
  }
  verb.values.forEach(value => columns.set(value.as || value.name, value));
  return query._wrap(
    {select: [...columns.values()], ...(query.isGrouped() ? {groupby: query._schema.groupby} : {})},
    {columns: [...columns.keys()]},
  );
}
