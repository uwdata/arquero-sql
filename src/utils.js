/** @typedef { import('./sql-query').SqlQuery } SqlQuery */
/** @typedef { import('./sql-query').Schema } Schema */
/** @typedef { import('./sql-query').Source } Source */

/** @typedef { {type: 'Column', name: string, as?: string, table?: number} } ColumnType */

/**
 *
 * @param {Schema} schema table schema
 * @param {object[]} selection list of expression in Verbs.select
 * @returns {object[] | null} list of selected columns
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
          const toexclude = resolveColumns(columns, s.arguments).map(column => column.as || column.name);
          return columns && columns.filter(field => !toexclude.includes(field)).map(c => createColumn(c));
        } else if (s.operator === 'all') {
          return columns.map(c => createColumn(c));
        }
      } else if (s.type === 'Column') {
        return [s];
      } else {
        throw new Error('Selection should only contains Selection or Column but received: ', selection);
      }
    })
    .flat();
  return fields.filter(
    (f, index) => fields.findIndex(field => (field.as || field.name) === (f.as || f.name)) === index,
  );
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
 * @param {string} name input name of the column
 * @param {string} [as] output name of the column
 * @returns {ColumnType} a column ast node with input name `name` and output namd `as`
 */
export function createColumn(name, as) {
  return {type: 'Column', name, ...(as ? {as} : {})};
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
