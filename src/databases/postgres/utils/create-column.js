/** @typedef { {type: 'Column', name: string, as?: string, table?: number} } ColumnType */

/**
 * create a column ast node with the name `name`
 * @param {string} name input name of the column
 * @param {string} [as] output name of the column
 * @param {number} [table] table identifier
 * @returns {ColumnType} a column ast node with input name `name` and output namd `as`
 */
export default function (name, as, table) {
  const _as = as && as !== name ? {as} : {};
  const _table = table ? {table} : {};
  return {type: 'Column', name, ..._as, ..._table};
}
