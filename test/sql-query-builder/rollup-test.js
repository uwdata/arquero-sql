import tape from 'tape';
import { op} from 'arquero';
import {createColumn} from '../../src/utils';
import {Verbs, base, deepEqualAll, toAst} from './common';

tape('SqlQueryBuilder: rollup', t => {
  const groupby = base.groupby(Verbs.groupby(['a', 'b']));

  const rollup1 = groupby.rollup(Verbs.rollup({a: d => op.mean(d.a), b2: d => d.max(d.b)}));

  deepEqualAll(t, rollup1._clauses.select, [
    [toAst(d => op.mean(d.a), 'a'), 'should replace groupby column with rollup columnd'],
    [createColumn('b'), 'should select groupby column'],
    [toAst(d => op.max(d.b), 'b2'), 'should include rollup column'],
  ]);

  t.end();
});
