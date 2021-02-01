import tape from 'tape';
import {not} from 'arquero';
import {base, pprint} from './common';

tape('SqlQuery: select', t => {
  const select1 = base.select(1, 'd', not('b'));
  // TODO: do real testing
  pprint(select1);

  t.end();
});
