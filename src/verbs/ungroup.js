/** @typedef { import('./common').Verb} Verb */

/**
 *
 * @param {SqlQuery} query
 */
export default function (query) {
  return query.isGrouped() ? query._wrap({columns: query.columnNames(), group: null}) : query;
}
