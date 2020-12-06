import tape from 'tape';
import {genExpr} from '../../src/visitors/gen-expr';
import {internal, op} from 'arquero';

const {Verbs} = internal;

tape('gen-expr', t => {
  const exprs1 = Verbs.derive({
    constant: () => 1 + 1,
    column1: d => d.a * d.b,
    column2: d => d.a * (d.b + 3),
    agg1: d => op.mean(d.a),
    row_num: () => op.row_number(),
  }).toAST().values;

  t.deepEqual(
    exprs1.map(expr => genExpr(expr)),
    ['(1+1)', '(a*b)', '(a*(b+3))', 'AVG(a)', 'ROW_NUMBER()'],
    'should generate expression correctly',
  );

  const expr2 = Verbs.join('t2', (a, b) => a.k1 === b.k2, ['_1', '_2']).toAST();
  t.deepEqual(
    genExpr(expr2.on, null, {1: 't1', 2: 't2'}),
    '(t1.k1=t2.k2)',
    "should generate expression with tables' alias correctly",
  );

  t.end();
});
