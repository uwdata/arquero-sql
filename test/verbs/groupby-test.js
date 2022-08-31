import tape from '../tape-wrapper';
import createColumn from '../../src/databases/postgres/utils/create-column';
import {GB_KEY} from '../../src/databases/postgres/verbs/groupby';
import {base, copy, group, onlyContainClsuses} from './common';

tape('verb: groupby', t => {
  const groupby = base.groupby('a', 'b');
  onlyContainClsuses(t, groupby, ['select']);
  t.deepEqual(
    copy(groupby._clauses.select),
    [...base.columnNames().map(c => createColumn(c)), ...['a', 'b'].map(c => createColumn(c, GB_KEY(c)))],
    'select includes groupby columns',
  );
  t.deepEqual(groupby._group, ['a', 'b'], 'annotate group in SqlQuery object');
  t.deepEqual(groupby.columnNames(), base.columnNames(), 'groupby do not change schema');
  t.equal(groupby._source, base, 'groupby wraps over previous query');

  t.end();
});

tape('verb: groupby with derived columns', t => {
  const groupby = base.groupby('a', {f: d => d.a + d.b});
  onlyContainClsuses(t, groupby, ['select']);
  t.deepEqual(
    copy(groupby._clauses.select),
    [
      ...base.columnNames().map(c => createColumn(c)),
      {type: 'Column', name: 'a', as: '___arquero_sql_group_a___'},
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '+',
        right: {type: 'Column', name: 'b'},
        as: '___arquero_sql_group_f___',
      },
    ],
    'select includes groupby columns',
  );
  t.deepEqual(groupby._group, ['a', 'f'], 'annotate group in SqlQuery object');
  t.deepEqual(groupby.columnNames(), base.columnNames(), 'groupby do not change schema');

  t.end();
});

tape('verb: groupby on grouped query', t => {
  const groupby = group.groupby({f: d => d.a + d.b});
  t.deepEqual(groupby, group.ungroup().groupby({f: d => d.a + d.b}), 'ungroup before grouping again');

  t.end();
});
