import tape from 'tape';
import {base, group, pprint} from './common';

tape('SqlQuery: groupby', t => {
  const groupby1 = base.groupby('a', {f: d => d.a + d.b});
  // TODO: do real testing
  pprint(groupby1);

  const groupby2 = base.groupby({f: d => d.a + d.b});
  // TODO: do real testing
  pprint(groupby2);

  const groupby3 = group.groupby({f: d => d.a + d.b});
  // TODO: do real testing
  pprint(groupby3);

  t.end();
});
