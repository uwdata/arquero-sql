import tape from 'tape';
import {genExp} from '../../src/visitors/gen-exp';
import {op, internal} from 'arquero';

const {Verbs} = internal;

tape('gen-exp', t => {
  const exprs = Verbs.derive({
    constant: () => 1 + 1,
    column1: d => d.a * d.b,
    column2: d => d.a * (d.b + 3),
    agg1: d => op.mean(d.a),
  }).toAST().values;

  t.deepEqual(
    exprs.map(expr => genExp(expr)),
    ['(1+1)', '(a*b)', '(a*(b+3))', 'AVG(a)'],
    'generate expression correctly',
  );

  t.end();
});
