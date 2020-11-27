/**
 *
 * @param {object} schema table schema
 * @param {object[]} selection list of expression in Verbs.select
 * @returns {string[] | null} list of selected field names
 */
export function resolveColumns(schema, selection) {
  if (!schema && selection.some(s => s.type === 'Selection')) {
    // cannot resolve selection without schema
    return null;
  }

  const {columns} = schema;
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
        return [s.name];
      } else {
        throw new Error('Selection should only contains Selection or Column but received: ', selection);
      }
    })
    .flat();
  return fields.filter((f, index) => fields.indexOf(f) === index);
}

export function isFunction(fn) {
  return typeof fn === 'function';
}
