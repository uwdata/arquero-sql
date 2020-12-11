import tape from 'tape';
import {base, deepEqualAll} from './common';

tape('SqlQueryBuilder: union', t => {
  const union = base.union(['other1', 'other2']);
  deepEqualAll(t, union._clauses.union, [
    ['other1', 'should union to other table'],
    ['other2', 'should union to other table'],
  ]);

  t.end();
});
