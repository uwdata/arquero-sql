import tape from 'tape';
import {desc} from 'arquero';
import {createColumn} from '../../src/utils';
import {Verbs, base, deepEqualAll, toAst} from './common';

tape('SqlQueryBuilder: orderby', t => {
  const filter = base.filter(Verbs.filter({k: d => d.a > 0}));

  const orderby = filter.orderby(Verbs.orderby([{a: d => d.a, b1: d => d.a + d.b, c2: desc(d => d.c)}]));
  t.ok(orderby._source === filter, 'should nest old table');
  deepEqualAll(t, orderby._clauses.orderby, [
    [createColumn('a'), 'orderby column'],
    [toAst(d => d.a + d.b), 'orderby derived column'],
    [toAst(desc(d => d.c)), 'orderby column descending'],
  ]);
  t.deepEqual(orderby._schema, filter._schema, 'schema should stay the same');

  t.end();
});
