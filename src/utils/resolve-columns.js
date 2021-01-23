import createColumn from './create-column';

/** @typedef { import('../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('../sql-query').Schema } Schema */
/** @typedef { import('../sql-query').Source } Source */
/** @typedef { {type: 'Column', name: string, as?: string, table?: number} } ColumnType */
/**
 *
 * @param {Schema} schema table schema
 * @param {object[]} selection list of expression in Verbs.select
 * @returns {object[] | null} list of selected columns
 */
export default function resolveColumns(schema, selection) {
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
