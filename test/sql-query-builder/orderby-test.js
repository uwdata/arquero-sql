import tape from 'tape';
import {desc} from 'arquero';
import {createColumn} from '../../src/utils';
import {base, copy, deepEqualAll, toAst} from './common';

tape('SqlQueryBuilder: orderby', t => {
  const filter = base.filter({k: d => d.a > 0});

  const orderby1 = filter.orderby([{a: d => d.a, b1: d => d.a + d.b, c2: desc(d => d.c)}]);
  t.ok(orderby1._source === filter, 'should nest old table');
  deepEqualAll(t, orderby1._clauses.orderby, [
    [createColumn('a'), 'orderby column'],
    [toAst(d => d.a + d.b), 'orderby derived column'],
    [toAst(desc(d => d.c)), 'orderby column descending'],
  ]);
  t.deepEqual(orderby1._schema, filter._schema, 'schema should stay the same');

  const order2 = ['a', desc('b')];
  const orderby2 = base.orderby(order2);
  const orderby3 = base.orderby(...order2);
  t.deepEqual(copy(orderby3), copy(orderby2), 'should allow flattened parameters');

  t.end();
});
