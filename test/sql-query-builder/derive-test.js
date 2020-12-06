import tape from 'tape';
import {createColumn} from '../../src/utils';
import {op} from 'arquero';
import {Verbs, base, baseWithGroupBy, deepEqualAll, noschema, toAst} from './common';

tape('SqlQueryBuilder: derive', t => {
  const derive1 = base.derive(
    Verbs.derive({
      constant: () => 1 + 1,
      column1: d => d.a * d.b,
      column2: d => d.a * (d.b + 3),
      c: () => op.row_number(),
    }),
  );

  deepEqualAll(t, derive1._clauses.select, [
    [createColumn('a'), 'should include original column'],
    [createColumn('b'), 'should include original column'],
    [toAst(() => op.row_number(), 'c'), 'should replace the original column with the same name'],
    [createColumn('d'), 'should include original column'],
    [toAst(() => 1 + 1, 'constant'), 'should derive constant'],
    [toAst(d => d.a * d.b, 'column1'), 'should derive expression'],
    [toAst(d => d.a * (d.b + 3), 'column2'), 'should derive nested expression'],
  ]);
  t.deepEqual(
    derive1._schema.columns,
    ['a', 'b', 'c', 'd', 'constant', 'column1', 'column2'],
    'should produce correct schema',
  );

  const derive2 = noschema.derive(Verbs.derive({constant: () => 1 + 1}));
  deepEqualAll(t, derive2._clauses.select, [
    [createColumn('*'), 'should select *'],
    [toAst(() => 1 + 1, 'constant'), 'should select derived field'],
  ]);
  t.notOk(derive2._schema, 'should not produce schema');

  const derive3 = base.derive(
    Verbs.derive({
      a: d => d.a,
      b: d => d.b + 1,
      c1: d => d.c,
    }),
  );
  deepEqualAll(t, derive3._clauses.select, [
    [createColumn('a'), 'should derive a column as its original name into a normal selection'],
    [toAst(d => d.b + 1, 'b'), 'should derive expression'],
    [createColumn('c'), 'should include original column'],
    [createColumn('d'), 'should include original column'],
    [toAst(d => d.c, 'c1'), 'shold derive a columnd into a new name'],
  ]);
  t.deepEqual(
    derive3._schema.columns,
    ['a', 'b', 'c', 'd', 'c1'],
    'should produce correct schema',
  );

  t.throws(() => {
    base.derive(Verbs.derive({a: d => op.mean(d.a)}));
  }, 'Derive does not allow aggregated operations');

  t.throws(() => baseWithGroupBy.derive({}), 'Need a rollup/count after a groupby before derive');

  t.end();
});
