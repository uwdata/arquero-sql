import tape from 'tape';
import {base, copy, group, onlyContainClsuses} from './common';
import createColumn from '../../src/utils/create-column';
import {GB_KEY} from '../../src/verbs/groupby';

tape('SqlQuery: derive', t => {
  const derive1 = base.derive({f: d => d.a, g: d => d.a + d.b});
  onlyContainClsuses(t, derive1, ['select']);
  t.deepEqual(
    derive1._clauses.select.slice(0, base.columnNames().length),
    base.columnNames().map(c => createColumn(c)),
    'derive selects original columns',
  );
  t.deepEqual(
    copy(derive1._clauses.select.slice(base.columnNames().length)),
    [
      {type: 'Column', name: 'a', as: 'f'},
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '+',
        right: {type: 'Column', name: 'b'},
        as: 'g',
      },
    ],
    'derive correct formula',
  );

  const derive2 = base.derive({f: d => d.a + 1, a: d => d.b + 2});
  onlyContainClsuses(t, derive2, ['select']);
  t.deepEqual(
    derive2._clauses.select.slice(1, base.columnNames().length),
    base
      .columnNames()
      .slice(1)
      .map(c => createColumn(c)),
    'derive selects original columns',
  );
  t.deepEqual(
    copy(derive2._clauses.select[0]),
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'b'},
      operator: '+',
      right: {type: 'Literal', value: 2, raw: '2'},
      as: 'a',
    },
    'derive correct overriden column',
  );
  t.deepEqual(
    copy(derive1._clauses.select[derive1._clauses.select.length - 1]),
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'a'},
      operator: '+',
      right: {type: 'Column', name: 'b'},
      as: 'g',
    },
    'derive correct formula',
  );

  const derive3 = group.derive({f: d => d.a, g: d => d.a + d.b});
  onlyContainClsuses(t, derive3, ['select']);
  t.deepEqual(derive3._source, group, 'only select from previous query');
  t.deepEqual(
    copy(derive3._clauses.select),
    [
      ...base.columnNames().map(c => createColumn(c)),
      {type: 'Column', name: 'a', as: 'f'},
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '+',
        right: {type: 'Column', name: 'b'},
        as: 'g',
      },
      ...group._group.map(c => createColumn(GB_KEY(c))),
    ],
    'derive groupby columns',
  );

  t.end();
});
