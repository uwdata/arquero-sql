/**
 * compose a list of queries with `verb`
 * @param {'union' | 'intersect' | 'except' | 'concat'} verb a verb to compose the list of queries
 * @param {SqlQuery} queries the list of queries to be composed
 * @returns {string} composed queries
 */
export default function (verb, queries) {
  return queries.map(nameOrSqlQueryToSql).join(verb + '\n');
}

/**
 * to SQL representation of the `table`
 * @param {Source} table table to be converted to SQL
 * @returns {string} SQL string of the table
 */
export function nameOrSqlQueryToSql(table) {
  if (typeof table === 'string') {
    return `SELECT *\nFROM ${table}\n`;
  } else {
    return table.toSql();
  }
}
