/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('./common').Verb} Verb */

import {internal} from 'arquero';
import error from 'arquero/src/util/error';
import isFunction from 'arquero/src/util/is-function';
import isNumber from 'arquero/src/util/is-number';
import isObject from 'arquero/src/util/is-object';
import isString from 'arquero/src/util/is-string';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').OrderKey[]} keys
 * @returns {SqlQuery}
 */
export default function (query, keys) {
  return query._wrap({orderby: parseValues(query, keys).exprs});
}

function parseValues(table, params) {
  let index = -1;
  const exprs = new Map();
  const add = val => exprs.set(++index + '', val);

  params.forEach(param => {
    const expr = param.expr != null ? param.expr : param;

    if (isObject(expr) && !isFunction(expr)) {
      for (const key in expr) add(expr[key]);
    } else {
      add(
        isNumber(expr)
          ? `d => d.${table.columnName(expr)}`
          : isString(expr)
          ? `d => d.${expr}`
          : isFunction(expr)
          ? param
          : error(`Invalid orderby field: ${param + ''}`),
      );
    }
  });

  return internal.parse(exprs, {ast: true});
}
