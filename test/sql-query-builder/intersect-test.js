import tape from 'tape';
import {base, deepEqualAll} from './common';

tape('SqlQueryBuilder: intersect', t => {
  const intersect = base.intersect(['other1', 'other2']);
  deepEqualAll(t, intersect._clauses.intersect, [
    ['other1', 'should intersect to other table'],
    ['other2', 'should intersect to other table'],
  ]);

  t.end();
});
