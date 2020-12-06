import tape from 'tape';
import {Verbs, base, deepEqualAll} from './common';

tape('SqlQueryBuilder: except', t => {
  const except = base.except(Verbs.except(['other1', 'other2']));
  deepEqualAll(t, except._clauses.except, [
    ['other1', 'should except to other table'],
    ['other2', 'should except to other table'],
  ]);

  t.end();
});
