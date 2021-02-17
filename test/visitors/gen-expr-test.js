import tape from 'tape';
import {genExpr} from '../../src/visitors/gen-expr';
import {internal, op} from 'arquero';

const {Verbs} = internal;

tape('gen-expr: 1 table expression', t => {
  const exprs = Verbs.derive({
    constant: () => 1 + 1,
    column1: d => d.a * d.b,
    column2: d => d.a * (d.b + 3),
    agg1: d => op.mean(d.a),
    row_num: () => op.row_number(),
    random: () => op.random(),
  }).toAST().values;

  const common_exprs = ['(1+1)', '(a*b)', '(a*(b+3))'];

  t.deepEqual(
    exprs.map(expr => genExpr(expr, {})),
    [...common_exprs, '(AVG(a) OVER ())', '(ROW_NUMBER() OVER ())', '(RANDOM())'],
    'should generate expression correctly',
  );

  t.deepEqual(
    exprs.map(expr => genExpr(expr, {partition: 'a,b'})),
    [...common_exprs, '(AVG(a) OVER (PARTITION BY a,b))', '(ROW_NUMBER() OVER (PARTITION BY a,b))', '(RANDOM())'],
    'should generate expression correctly: with partition',
  );

  t.deepEqual(
    exprs.map(expr => genExpr(expr, {order: 'c,d'})),
    [...common_exprs, '(AVG(a) OVER ())', '(ROW_NUMBER() OVER (ORDER BY c,d))', '(RANDOM())'],
    'should generate expression correctly: with order',
  );

  t.deepEqual(
    exprs.map(expr => genExpr(expr, {partition: 'a,b', order: 'c,d'})),
    [
      ...common_exprs,
      '(AVG(a) OVER (PARTITION BY a,b))',
      '(ROW_NUMBER() OVER (PARTITION BY a,b ORDER BY c,d))',
      '(RANDOM())',
    ],
    'should generate expression correctly: with partition and order',
  );

  t.end();
});

tape('gen-expr: 2 tables expression', t => {
  const expr = Verbs.join('t2', (a, b) => a.k1 === b.k2, ['_1', '_2']).toAST();
  t.deepEqual(
    genExpr(expr.on, null, {1: 't1', 2: 't2'}),
    '(t1.k1=t2.k2)',
    "should generate expression with tables' alias correctly",
  );

  t.end();
});
