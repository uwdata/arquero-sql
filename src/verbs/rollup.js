/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {internal} from 'arquero';
import createColumn from '../utils/create-column';
import {GB_KEY_PREFIX, GB_KEY_SUFFIX} from './groupby';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').ExprObject} [keys]
 * @returns {SqlQuery}
 */
export default function (query, keys = []) {
  /** @type {Map<string, object>} */
  const columns = new Map();
  if (query.isGrouped()) {
    query._schema.groupby.forEach(key => {
      const next = key.slice(GB_KEY_PREFIX.length, -GB_KEY_SUFFIX.length);
      columns.set(next, createColumn(key, next));
    });
  }

  const {exprs, names} = internal.parse(keys, {ast: true, argonly: true});
  exprs.forEach((expr, idx) => {
    const as = names[idx];
    columns.set(as, {...expr, as});
  });

  return query._wrap(
    {select: [...columns.values()], ...(query.isGrouped() ? {groupby: query._schema.groupby} : {})},
    {columns: [...columns.keys()]},
  );
}
