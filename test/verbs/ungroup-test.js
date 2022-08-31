import tape from '../tape-wrapper';
import {base, group} from './common';

tape('verb: ungroup', t => {
  const ungroup = group.ungroup();
  t.deepEqual(ungroup._source, group, 'ungroup wraps around the previous query');
  t.notOk(ungroup._group, 'should not contain group');

  t.end();
});

tape('verb: ungroup a query without group', t => {
  const ungroup = base.ungroup();
  t.equal(ungroup, base, 'does not make any change');

  t.end();
});
