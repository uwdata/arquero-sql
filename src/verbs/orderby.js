/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('./common').Verb} Verb */

/**
 * 
 * @param {SqlQuery} query 
 * @param {Verb} verb 
 */
export default function(query, verb) {
  return query._wrap({orderby: verb.toAST().keys});
}