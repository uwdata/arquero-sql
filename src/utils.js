/** @typedef { import('./sql-query').SqlQuery } SqlQuery */
/** @typedef { import('./sql-query').Schema } Schema */
/** @typedef { import('./sql-query').Source } Source */

/**
 *
 * @param {Schema} schema table schema
 * @param {object[]} selection list of expression in Verbs.select
 * @returns {string[] | null} list of selected field names
 */
export function resolveColumns(schema, selection) {
  if (!schema && selection.some(s => s.type === 'Selection')) {
    // cannot resolve selection without schema
    return null;
  }

  const columns = schema && schema.columns;
  const fields = selection
    .map(s => {
      if (s.type === 'Selection') {
        if (s.operator === 'not') {
          const toexclude = resolveColumns(columns, s.arguments);
          return columns && columns.filter(field => !toexclude.includes(field));
        } else if (s.operator === 'all') {
          return columns;
        }
      } else if (s.type === 'Column') {
        // TODO: selection with as?
        return [s.name];
      } else {
        throw new Error('Selection should only contains Selection or Column but received: ', selection);
      }
    })
    .flat();
  return fields.filter((f, index) => fields.indexOf(f) === index);
}

/**
 * check if fn is a function
 * @param {any} fn function to check
 * @returns {boolean} if fn is a function
 */
export function isFunction(fn) {
  return typeof fn === 'function';
}

/**
 * create a column ast node with the name `name`
 * @param {string} name name of the column
 * @returns {{type: 'Column', name: string}} a column ast node with name `name`
 */
export function createColumn(name) {
  return {type: 'Column', name};
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

/**
 * compose a list of queries with `verb`
 * @param {'union' | 'intersect' | 'except' | 'concat'} verb a verb to compose the list of queries
 * @param {SqlQuery} queries the list of queries to be composed
 * @returns {string} composed queries
 */
export function composeQueries(verb, queries) {
  return queries.map(nameOrSqlQueryToSql).join(verb + '\n');
}
