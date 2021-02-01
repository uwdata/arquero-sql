import tape from 'tape';
import {base, pprint} from './common';

tape('SqlQuery: sample', t => {
  const sample1 = base.sample(5);
  // TODO: do real testing
  pprint(sample1);

  t.end();
});
