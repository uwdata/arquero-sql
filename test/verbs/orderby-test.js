import tape from 'tape';
import {base, pprint} from './common';

tape('SqlQuery: orderby', t => {
  const orderby1 = base.orderby('a', d => d.b * 2, {k: d => d.a + 3});
  // TODO: do real testing
  pprint(orderby1);

  t.end();
});
