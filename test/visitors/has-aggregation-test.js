import tape from 'tape';
import {internal, op} from 'arquero';
import {hasAggregation} from '../../src/visitors/has-aggregation';

const {Verbs} = internal;

tape('has-aggregation', t => {
  const exprs = Verbs.derive({
    constant: () => 1 + 1,
    column1: d => d.a * d.b,
    column2: d => d.a * (d.b + 3),
    agg1: d => op.mean(d.a),
    row_num: () => op.row_number(),
  }).toAST().values;

  t.deepEqual(
    exprs.map(expr => hasAggregation(expr)),
    [false, false, false, true, false],
    'can detect aggregation operations',
  );

  t.end();
});
