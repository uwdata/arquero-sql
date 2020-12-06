import tape from 'tape';
import {createColumn} from '../../src/utils';
import {op} from 'arquero';
import {genExpr} from '../../src/visitors/gen-expr';
import {Verbs, base, baseWithGroupBy, copy, noschema, toAst} from './common';

tape('SqlQueryBuilder: derive', t => {
  const derive1 = base.derive(
    Verbs.derive({
      constant: () => 1 + 1,
      column1: d => d.a * d.b,
      column2: d => d.a * (d.b + 3),
      c: () => op.row_number(),
    }),
  );

  t.deepEqual(derive1._clauses.select[0], createColumn('a'), 'should include original column');
  t.deepEqual(derive1._clauses.select[1], createColumn('b'), 'should include original column');
  t.deepEqual(
    derive1._clauses.select[2],
    toAst(() => op.row_number(), 'c'),
    'should replace the original column with the derived column with the same name',
  );
  t.deepEqual(derive1._clauses.select[3], createColumn('d'), 'should include original column');
  t.deepEqual(
    copy(derive1._clauses.select[4]),
    toAst(() => 1 + 1, 'constant'),
    'should derive constant',
  );
  t.deepEqual(
    copy(derive1._clauses.select[5]),
    toAst(d => d.a * d.b, 'column1'),
    'should derive expression',
  );
  t.deepEqual(
    copy(derive1._clauses.select[6]),
    toAst(d => d.a * (d.b + 3), 'column2'),
    'should derive nested expression',
  );
  t.deepEqual(
    derive1._schema.columns,
    ['a', 'b', 'c', 'd', 'constant', 'column1', 'column2'],
    'should produce correct schema',
  );

  const derive2 = noschema.derive(Verbs.derive({constant: () => 1 + 1}));
  t.deepEqual(derive2._clauses.select[0], createColumn('*'), 'should select *');
  t.deepEqual(genExpr(derive2._clauses.select[1]), '(1+1)', 'should select derived field');
  t.notOk(derive2._schema, 'should not produce schema');

  t.throws(() => {
    base.derive(Verbs.derive({a: d => op.mean(d.a)}));
  }, 'Derive does not allow aggregated operations');

  t.throws(() => baseWithGroupBy.derive({}), 'Need a rollup/count after a groupby before derive');

  t.end();
});
