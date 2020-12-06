import tape from 'tape';
import {table} from 'arquero';
import {Verbs, base} from './common';

tape('Sql-query-builder: combining sql ', t => {
  const table1 = table({
    a: [1],
    b: [3],
  });

  const union1 = base.union(Verbs.union([table1]));

  t.deepEqual(union1._clauses.union[0]._names, ['a', 'b'], 'query that combines statement');

  t.end();
});
