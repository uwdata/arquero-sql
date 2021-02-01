import tape from 'tape';
import {group, pprint} from './common';

tape('SqlQuery: ungroup', t => {
  const ungroup1 = group.ungroup();
  pprint(ungroup1);

  t.end();
});
