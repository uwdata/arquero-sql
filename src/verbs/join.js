/** @typedef {import('./common').Verb} Verb */

import {SqlQuery} from '../sql-query';
import createColumn from '../utils/create-column';
import {internal} from 'arquero';
import resolve from './expr/selection';

/** @type {['inner', 'left', 'right', 'outer']} */
const JOIN_OPTIONS = ['inner', 'left', 'right', 'outer'];

/**
 *
 * @param {SqlQuery} query
 * @param {Verb} verb
 * @returns {SqlQuery}
 */
export default function (query, other, on, values, options = {}) {
  other = typeof other === 'string' ? new SqlQuery(other) : other;
  const {on: _on, values: _values} = internal.Verbs.join(other, on, values, options).toAST();

  if (!(typeof _on === 'object') && !(Array.isArray(_on) && _on.length < 2)) {
    throw new Error('"on" should either be an expression or [Column[], Column[]]');
  }

  if (_values && (!Array.isArray(_values) || _values.length < 2 || _values.some(value => !Array.isArray(value)))) {
    throw new Error('value must be of type [list, list]');
  }

  if (
    !(other instanceof SqlQuery && other._schema && (other._schema.groupby || other._schema.columns)) &&
    !(_values && _values[1].every(column => column.type === 'Column'))
  ) {
    throw new Error('If output columns are not specified, joining table must be a SqlQuery with schema');
  }

  if (_values && _values.flat().some(v => v.type !== 'Column' && v.type !== 'Selection')) {
    // TODO: support output value as expression
    // Plan: derive the expressions as new columns before joining
    throw new Error('Arquero-SQL does not support joining value as expression');
  }

  const suffix = options.suffix || ['_1', '_2'];
  const this_values = resolve(query, (_values && _values[0]) || {type: 'Selection', operator: 'all'});
  const other_values = resolve(other, (_values && _values[1]) || {type: 'Selection', operator: 'all'});
  const _select = new Map();
  [this_values, other_values].forEach((_values, idx) => {
    _values.forEach((curr, next) => {
      _select.set(next + suffix[idx], createColumn(curr, next + suffix[idx], idx + 1));
    });
  });

  const select = [..._select.values()];
  return query._wrap(
    {
      select,
      join: {
        other,
        on: _on,
        join_option: JOIN_OPTIONS[(~~options.left << 1) + ~~options.right],
      },
    },
    {columns: select.map(c => c.as || c.name)},
  );
}
