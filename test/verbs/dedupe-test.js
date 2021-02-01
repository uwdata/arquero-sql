import {not} from 'arquero';
import tape from 'tape';
// import {op} from 'arquero';
import {base, group, pprint} from './common';

tape('SqlQuery: dedupe', t => {
  const dedupe1 = base.dedupe('a', not('a'), {f: d => d.a, g: d => d.a + d.b});
  // TODO: do real testing
  pprint(dedupe1);

  const dedupe3 = group.dedupe('a', not('a'), {f: d => d.a, g: d => d.a + d.b});
  // TODO: do real testing
  pprint(dedupe3);

  t.end();
});
