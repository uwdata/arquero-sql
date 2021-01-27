/**
 * create a column ast node with the name `name`
 * @param {string} name input name of the column
 * @param {string} [as] output name of the column
 * @returns {ColumnType} a column ast node with input name `name` and output namd `as`
 */
export default function (name, as) {
  return {type: 'Column', name, ...(as && as !== name ? {as} : {})};
}
