import tape from 'tape';
import {op, table} from 'arquero';
import {Verbs, base, baseWithGroupBy, copy} from './common';

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
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'a'},
      operator: '>',
      right: {type: 'Literal', value: 0, raw: '0'},
      as: 'c1',
    },
    'Non-aggregate function add to where',
  );

  t.deepEqual(
    copy(filterForHaving._clauses.having[0]),
    {
      type: 'BinaryExpression',
      left: {
        type: 'CallExpression',
        callee: {type: 'Function', name: 'mean'},
        arguments: [
          {
            type: 'Column',
            name: 'a',
          },
        ],
      },
      operator: '>',
      right: {type: 'Literal', value: 0, raw: '0'},
      as: 'c1',
    },
    'aggregate function with groupby add to having',
  );

  t.deepEqual(
    copy(filterForHaving._clauses.where[0]),
    {
      type: 'BinaryExpression',
      left: {
        type: 'Column',
        name: 'b',
      },
      operator: '>',
      right: {type: 'Literal', value: 0, raw: '0'},
      as: 'c2',
    },
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

tape('Sql-query-builder: combining sql ', t => {
  const table1 = table({
    a: [1],
    b: [3],
  });

  const union1 = base.union(Verbs.union([table1]));

  t.deepEqual(union1._clauses.union[0]._names, ['a', 'b'], 'query that combines statement');

  t.end();
});
