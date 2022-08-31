import tape from '../tape-wrapper';
import {op} from 'arquero';
import {group} from './common';

tape('verb: count', t => {
  const count1 = group.count({as: 'count_'});
  const rollup1 = group.rollup({count_: () => op.count()});

  t.deepEqual(count1, rollup1, 'desugar into rollup');

  const count2 = group.count();
  const rollup2 = group.rollup({count: () => op.count()});
  t.deepEqual(count2, rollup2, 'correct default output name');

  t.end();
});
