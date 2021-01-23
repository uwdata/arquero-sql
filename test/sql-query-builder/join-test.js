import tape from 'tape';
import createColumn from '../../src/utils/create-column';
import {base, copy, twoTableExprToAst} from './common';

tape('SqlQueryBuilder: join', t => {
  const table1 = base.filter([d => d.col1 === 0]);
  const table2 = base.filter([d => d.col2 === 0]);

  const join1 = table1.join(table2, ['col1', 'col2'], [[], []], {});
  t.deepEqual(join1._clauses.join.on, [[createColumn('col1')], [createColumn('col2')]], 'should join correctly');

  const join2 = table1.join(
    table2,
    [
      ['col1', 'col2'],
      ['col2', 'col3'],
    ],
    [[], []],
    {},
  );
  t.deepEqual(
    join2._clauses.join.on,
    [
      [createColumn('col1'), createColumn('col2')],
      [createColumn('col2'), createColumn('col3')],
    ],
    'should join correctly, joining with multiple columns',
  );

  const join3 = table1.join(table2, (a, b) => a.col1 + b.col2 === 0, [[], []], {});
  t.deepEqual(
    copy(join3._clauses.join.on),
    twoTableExprToAst((a, b) => a.col1 + b.col2 === 0),
    'should join correctly, joining with an expression',
  );

  t.end();
});
