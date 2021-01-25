/** @typedef {import('./common').Verb} Verb */

import {SqlQuery} from '../sql-query';
import resolveColumns from '../utils/resolve-columns';
import createColumn from '../utils/create-column';

/** @type {['inner', 'left', 'right', 'outer']} */
const JOIN_OPTIONS = ['inner', 'left', 'right', 'outer'];

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, verb) {
  const {table, on, values, options} = verb.toAST();

  if (!(typeof on === 'object') && !(Array.isArray(on) && on.length < 2)) {
    throw new Error('"on" should either be an expression or [Column[], Column[]]');
  }

  if (values && (!Array.isArray(values) || values.length < 2 || values.some(value => !Array.isArray(value)))) {
    throw new Error('value must be of type [list, list]');
  }

  if (
    !(table instanceof SqlQuery && table._schema && (table._schema.groupby || table._schema.columns)) &&
    !(values && values[1].every(column => column.type === 'Column'))
  ) {
    throw new Error('If output columns are not specified, joining table must be a SqlQuery with schema');
  }

  /** @type {SqlQuery} */
  const other = typeof table === 'string' ? new SqlQuery(table) : table;
  if (values && values.flat().some(v => v.type !== 'Column' || v.type !== 'Selection')) {
    // TODO: support output value as expression
    // Plan: derive the expressions as new columns before joining
    throw new Error('Arquero-SQL does not support joining value as expression');
  }

  const this_schema = query._schema.columns;
  const this_values = (values && resolveColumns(this_schema, values[0])) || this_schema.map(c => createColumn(c));

  const other_schema = (other._schema && other._schema.groupby) || other._schema.columns;
  const other_values = (values && resolveColumns(other_schema, values[1])) || other_schema.map(c => createColumn(c));

  const _options = typeof options === 'object' ? options : {};
  const join_option = JOIN_OPTIONS[(~~_options.left << 1) + ~~_options.right];
  const {suffix} = _options;
  const suffixes = Array.isArray(suffix) && suffix.length >= 2 ? suffix : ['_1', '_2'];
  const addTablesAndSuffixes = suffixes.map((s, i) => column => ({
    ...column,
    table: i + 1,
    as: (column.as || column.name) + s,
  }));

  const select = [this_values, other_values].map((v, i) => addTablesAndSuffixes[i](v)).flat();
  return query._wrap(
    {
      select,
      join: {
        other,
        on,
        join_option,
      },
    },
    {columns: select.map(c => c.as || c.name)},
  );
}
