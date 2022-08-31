import tape from '../tape-wrapper';
import {internal, op} from 'arquero';
import hasFunction from '../../src/databases/postgres/visitors/has-function';
import {ARQUERO_AGGREGATION_FN, ARQUERO_WINDOW_FN} from '../../src/databases/postgres/visitors/gen-expr';

const {Verbs} = internal;

tape('has-function', t => {
  const exprs = Verbs.derive({
    constant: () => 1 + 1,
    column1: d => d.a * d.b,
    column2: d => d.a * (d.b + 3),
    agg1: d => op.mean(d.a),
    row_num: () => op.row_number(),
  }).toAST().values;

  t.deepEqual(
    exprs.map(expr => hasFunction(expr, ARQUERO_AGGREGATION_FN)),
    [false, false, false, true, false],
    'can detect aggregation operations',
  );

  t.deepEqual(
    exprs.map(expr => hasFunction(expr, ARQUERO_WINDOW_FN)),
    [false, false, false, false, true],
    'can detect window operations',
  );

  t.end();
});
