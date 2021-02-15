import tape from 'tape';
import {not} from 'arquero';
import {base, copy, group, onlyContainClsuses} from './common';

tape('verb: select', t => {
  const select = base.select(1, 'd');
  onlyContainClsuses(t, select, ['select']);
  t.deepEqual(
    copy(select._clauses.select),
      [ { type: 'Column', name: 'b' }, { type: 'Column', name: 'd' } ],
    'correct selection with number column and name column'
  );
  t.deepEqual(
    select._source,
    base,
    'select should wrap the previous query'
  );
  t.deepEqual(
    select.columnNames(),
    ['b', 'd'],
    'select produces correct schema'
  );

  t.end();
});

tape('verb: select with selection function', t => {
  const select = base.select('d', not('b'));
  onlyContainClsuses(t, select, ['select']);
  t.deepEqual(
    copy(select._clauses.select),
      [ { type: 'Column', name: 'd' }, { type: 'Column', name: 'a' }, { type: 'Column', name: 'c' } ],
    'correct selection with selection function'
  );
  t.deepEqual(
    select.columnNames(),
    ['d', 'a', 'c'],
    'select produces correct schema'
  );

  t.end();
});

tape('verb: select with grouped query', t => {
  const select = group.select('d', not('b'));
  onlyContainClsuses(t, select, ['select']);
  t.deepEqual(
    copy(select._clauses.select),
      [ { type: 'Column', name: 'd' }, { type: 'Column', name: 'a' }, { type: 'Column', name: 'c' }, { type: 'Column', name: '___arquero_sql_group_a___' }, { type: 'Column', name: '___arquero_sql_group_b___' } ],
    'selection includes groupby columns'
  );
  t.deepEqual(
    select.columnNames(),
    ['d', 'a', 'c'],
    'select produces correct schema without groupby columns'
  );
  t.deepEqual(
    select._group,
    group._group,
    'the new SqlQuery object is annotated with groupby keys'
  ),

  t.end();
});
