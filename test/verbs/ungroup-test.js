import tape from 'tape';
import {group, pprint} from './common';

tape('SqlQuery: ungroup', t => {
  const ungroup1 = group.ungroup();
  // TODO: do real testing
  pprint(ungroup1);

  t.end();
});
