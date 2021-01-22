/** @typedef { import('../sql-query').SqlQuery } SqlQuery */

/**
 * 
 * @param {SqlQuery} query 
 * @param {object} verb 
 */
export default function(query, verb) {
  return query._wrap({orderby: verb.keys});
}