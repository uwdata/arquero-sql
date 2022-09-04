/** @typedef {import('../pg-table-view').PostgresTableView} PostgresTableView */
/** @typedef {import('arquero/src/table/transformable').ExprList} ExprList */
/** @typedef {import('arquero/src/table/transformable').FoldOptions} FoldOptions */

import parse from 'arquero/src/verbs/util/parse';
import createColumn from '../utils/create-column';


/**
 * @param {PostgresTableView} table
 * @param {ExprList} values
 * @param {FoldOptions} [options]
 */
export default function(table, values, options = {}) {
  const [k = 'key', v = 'value'] = options.as || [];
  const {names, exprs, ops} = parse('fold', table, values, {ast: true});
  if (ops && ops.length) {
    throw new Error('TODO: support ops from parse');
  }

  table = table.ungroup();
  const otherColumns = table._columns.filter(c => !names.includes(c));

  let _expr = {type: 'Literal', raw: 'null'};
  for (const i in names) {
    const name = names[i];
    const expr = exprs[i];

    _expr = {
      type: 'ConditionalExpression',
      test: {
        type: 'LogicalExpression',
        left: {type: 'Constant', raw: "'" + name + "'"},
        right: {type: 'Constant', raw: '__aq__fold__key__'},
        operator: '===',
      },
      consequent: expr,
      alternate: _expr,
    };
  }
  
  return table._wrap({
    columns: [...otherColumns, k, v],
    clauses: {
      select: [
        ...otherColumns.map(c => createColumn(c)),
        createColumn('__aq__fold__key__', k),
        {..._expr, as: v},
      ],
      join: {
        other: `(SELECT unnest(ARRAY[${names.map(name => "'" + name + "'").join(',')}]) __aq__fold__key__)`,
      },
    }
  });
}