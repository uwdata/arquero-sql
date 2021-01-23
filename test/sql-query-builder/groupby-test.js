import tape from 'tape';
import {not} from 'arquero';
import createColumn from '../../src/utils/create-column';
import {base, copy, deepEqualAll, noschema, toAst} from './common';

tape('SqlQueryBuilder: groupby', t => {
  const group1 = ['a', 'b'];
  const groupby1 = base.groupby(group1);
  t.deepEqual(groupby1._schema.groupby, group1, 'should produce correct schema with groupby');
  t.deepEqual(
    groupby1._clauses.select,
    group1.map(c => createColumn(c)),
    'should select only groupby columns',
  );

  const groupby2 = base.groupby({a: d => d.a, b1: d => d.b === 3, c: d => d.c, f: d => d.a + d.b});
  // TODO: _clauses.groupby and _schema.groupby are redundant, should combind this
  t.deepEqual(groupby2._clauses.groupby, ['a', 'b1', 'c', 'f'], 'should produce correct groupby');
  t.deepEqual(groupby2._schema.groupby, ['a', 'b1', 'c', 'f'], 'should produce correct schema with groupby');
  deepEqualAll(t, groupby2._source._clauses.select, [
    [createColumn('a'), 'inner table should derive original column'],
    [createColumn('b'), 'inner table should derive original column'],
    [createColumn('c'), 'inner table should derive original column'],
    [createColumn('d'), 'inner table should derive original column'],
    [toAst(d => d.b === 3, 'b1'), 'inner table should derive new column'],
    [toAst(d => d.a + d.b, 'f'), 'inner table should derive new column'],
  ]);

  const groupby3 = base.groupby([not('a', 'b'), 'b']);
  t.deepEqual(groupby3._clauses.groupby, ['c', 'd', 'b'], 'should produce correct groupby');
  t.deepEqual(groupby3._schema.groupby, ['c', 'd', 'b'], 'should produce correct schema with groupby');

  t.throws(() => groupby1.groupby('c'), 'Need a rollup/count after a groupby before groupby');
  t.throws(() => noschema.groupby(not('a')), 'Cannot resolve not/all selection without schema');

  const groupby4 = base.groupby(...group1);
  t.deepEqual(copy(groupby4), copy(groupby1), 'should allow flattened parameters');

  t.end();
});
