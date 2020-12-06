import tape from 'tape';
import {SqlQueryBuilder} from '../src/sql-query-builder';
import {createColumn} from '../src/utils';
import {internal, op, table} from 'arquero';
import {genExpr} from '../src/visitors/gen-expr';

const {Verbs} = internal;
const base = new SqlQueryBuilder('table-name', null, {columns: ['a', 'b', 'c', 'd']});
const noschema = new SqlQueryBuilder('table-name', null);
const baseWithGroupBy = new SqlQueryBuilder('table-name', null, {columns: ['a', 'b', 'c', 'd'], groupby: ['a', 'b']});

function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

tape('SqlQueryBuilder: derive', t => {
  const derive1 = base.derive(
    Verbs.derive({
      constant: () => 1 + 1,
      column1: d => d.a * d.b,
      column2: d => d.a * (d.b + 3),
      c: () => op.row_number(),
    }),
  );

  t.deepEqual(derive1._clauses.select[0], createColumn('a'), 'should include original column');
  t.deepEqual(derive1._clauses.select[1], createColumn('b'), 'should include original column');
  t.deepEqual(
    derive1._clauses.select[2],
    {
      type: 'CallExpression',
      callee: {type: 'Function', name: 'row_number'},
      arguments: [],
      as: 'c',
    },
    'should replace the original column with the derived column with the same name',
  );
  t.deepEqual(derive1._clauses.select[3], createColumn('d'), 'should include original column');
  t.deepEqual(
    copy(derive1._clauses.select[4]),
    {
      type: 'BinaryExpression',
      left: {type: 'Literal', value: 1, raw: '1'},
      operator: '+',
      right: {type: 'Literal', value: 1, raw: '1'},
      as: 'constant',
    },
    'should derive constant',
  );
  t.deepEqual(
    copy(derive1._clauses.select[5]),
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'a'},
      operator: '*',
      right: {type: 'Column', name: 'b'},
      as: 'column1',
    },
    'should derive expression',
  );
  t.deepEqual(
    copy(derive1._clauses.select[6]),
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'a'},
      operator: '*',
      right: {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'b'},
        operator: '+',
        right: {type: 'Literal', raw: '3', value: 3},
      },
      as: 'column2',
    },
    'should derive nested expression',
  );
  t.deepEqual(
    derive1._schema.columns,
    ['a', 'b', 'c', 'd', 'constant', 'column1', 'column2'],
    'should produce correct schema',
  );

  const derive2 = noschema.derive(Verbs.derive({constant: () => 1 + 1}));
  t.deepEqual(derive2._clauses.select[0], createColumn('*'), 'should select *');
  t.deepEqual(genExpr(derive2._clauses.select[1]), '(1+1)', 'should select derived field');
  t.notOk(derive2._schema, 'should not produce schema');

  t.throws(() => {
    base.derive(Verbs.derive({a: d => op.mean(d.a)}));
  }, 'Derive does not allow aggregated operations');

  t.throws(() => baseWithGroupBy.derive({}), 'Need a rollup/count after a groupby before derive');

  t.end();
});

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
