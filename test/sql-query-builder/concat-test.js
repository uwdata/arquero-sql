import tape from 'tape';
import {Verbs, base, deepEqualAll} from './common';

tape('SqlQueryBuilder: concat', t => {
  const concat = base.concat(Verbs.concat(['other1', 'other2']));
  deepEqualAll(t, concat._clauses.concat, [
    ['other1', 'should concat to other table'],
    ['other2', 'should concat to other table'],
  ]);

  t.end();
});
