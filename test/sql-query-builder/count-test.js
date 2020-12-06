import tape from 'tape';
import {op} from 'arquero';
import {Verbs, base, deepEqualAll, toAst} from './common';

tape('SqlQueryBuilder: count', t => {
  const groupby = base.groupby(Verbs.groupby(['a', 'b']));
  const count = groupby.count(Verbs.count({as: 'count_'}));

  deepEqualAll(t, count._clauses.select, [
    [toAst(() => op.count(), 'count_'), 'should include the new count_ column'],
  ]);

  t.end();
});
