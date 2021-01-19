/** @typedef { import('../sql-query').SqlQuery } SqlQuery */

/**
 * 
 * @param {SqlQuery} query 
 * @param {object} verb 
 */
export default function(query, verb) {
  if (!query._schema && verb.columns.some(column => column.type === 'Selection')) {
    // TODO: match, startwith...
    throw new Error("Cannot select with 'all' or 'not' without schema");
  }
}