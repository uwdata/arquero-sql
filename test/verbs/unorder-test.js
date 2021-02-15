import tape from 'tape';
import {base} from './common';

tape('verb: unorder', t => {
  const unorder = base.orderby('a').unorder();
  t.deepEqual(
    unorder._source,
    base.orderby('a'),
    'ungroup wraps around the previous query'
  );
  t.notOk(unorder._order, 'should not contain order');

  t.end();
});

tape('verb: unorder a query without order', t => {
  const unorder = base.unorder();
  t.equal(
    unorder,
    base,
    'does not make any change'
  );

  t.end();
});
