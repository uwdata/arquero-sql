/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import {op} from 'arquero';

/**
 *
 * @param {SqlQuery} query
 * @param {import('arquero/src/table/transformable').CountOptions} [options]
 * @returns {SqlQuery}
 */
export default function (query, options = {as: 'count'}) {
  return query.rollup({[options.as]: () => op.count()});
}
