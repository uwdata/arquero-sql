import tape from 'tape';
import {op} from 'arquero';
import {Verbs, base, baseWithGroupBy, copy, toAst} from './common';

tape('Sql-query-builder: filter', t => {
  const filterForWhere = base.filter(
    Verbs.filter({
      c1: d => d.a > 0,
    }),
  );

  const filterForHaving = baseWithGroupBy.filter(
    Verbs.filter({
      c1: d => op.mean(d.a) > 0,
      c2: d => d.b > 0,
    }),
  );

  t.deepEqual(
    copy(filterForWhere._clauses.where[0]),
    toAst(d => d.a > 0, 'c1'),
    'Non-aggregate function add to where',
  );

  t.deepEqual(
    copy(filterForHaving._clauses.having[0]),
    toAst(d => op.mean(d.a) > 0, 'c1'),
    'aggregate function with groupby add to having',
  );

  t.deepEqual(
    copy(filterForHaving._clauses.where[0]),
    toAst(d => d.b > 0, 'c2'),
    'non-aggregate function with groupby add to where',
  );

  t.throws(
    () =>
      base.filter(
        Verbs.filter({
          c1: d => op.mean(d.a) > 0,
        }),
      ),
    'Cannot fillter using aggregate operations without groupby',
  );

  t.end();
});
