import {op} from 'arquero';
import tape from 'tape';
import {group, pprint} from './common';

tape('SqlQuery: rollup', t => {
  const rollup1 = group.rollup({k: d => op.mean(d.a)});
  pprint(rollup1);

  t.end();
});
