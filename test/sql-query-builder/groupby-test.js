import tape from 'tape';
import {Verbs, base} from './common';

tape('SqlQueryBuilder: groupby', t => {
  const groupby = base.groupby(Verbs.groupby(['a', 'b']));

  t.deepEqual(groupby._schema.groupby, ['a', 'b'], 'should produce correct schema with groupby');

  t.throws(() => groupby.groupby('c'), 'Need a rollup/count after a groupby before groupby');

  t.end();
});
