import tape from 'tape';
import {op} from 'arquero';
import {base, group, pprint} from './common';

tape('SqlQuery: filter', t => {
  const filter1 = base.filter(d => d.a === 3);
  pprint(filter1);

  const filter2 = base.filter(d => op.mean(d.a) === 3);
  pprint(filter2);

  const filter3 = group.filter(d => op.mean(d.a) === 3);
  pprint(filter3);

  // TODO: test reserved column name

  t.end();
});
