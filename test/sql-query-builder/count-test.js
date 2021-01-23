import tape from 'tape';
import {op} from 'arquero';
import {base, deepEqualAll, toAst} from './common';
import createColumn from '../../src/utils/create-column';

tape('SqlQueryBuilder: count', t => {
  const groupby = base.groupby(['a', 'b']);
  const count = groupby.count({as: 'count_'});

  deepEqualAll(t, count._clauses.select, [
    [createColumn('a'), 'should include groupby column'],
    [createColumn('b'), 'should include groupby column'],
    [toAst(() => op.count(), 'count_'), 'should include the new count_ column'],
  ]);

  t.end();
});
