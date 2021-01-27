/** @typedef { import('./common').Verb} Verb */

import {SqlQuery} from '../sql-query';

/**
 *
 * @param {SqlQuery} query
 */
export default function (query) {
  return query.isGrouped() ? new SqlQuery(query._source, query._clauses, {columns: query._schema.columns}) : query;
}
