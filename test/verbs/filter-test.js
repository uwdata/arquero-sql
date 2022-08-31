import tape from '../tape-wrapper';
import {op} from 'arquero';
import {base, copy, group, onlyContainClsuses} from './common';
import createColumn from '../../src/databases/postgres/utils/create-column';

tape('verb: filter', t => {
  const filter = base.filter(d => d.a === 3);
  onlyContainClsuses(t, filter, ['where']);
  t.deepEqual(filter._source, base, 'only filter from previous query');
  t.deepEqual(
    copy(filter._clauses.where),
    [
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '===',
        right: {type: 'Literal', value: 3, raw: '3'},
      },
    ],
    'correct filter',
  );
  t.deepEqual(filter._columns, ['a', 'b', 'c', 'd'], 'filter does not change schema');

  t.end();
});

tape('verb: filter with aggregate function', t => {
  const filter = base.filter(d => op.mean(d.a) === 3);
  onlyContainClsuses(t, filter, ['select']);
  t.deepEqual(
    copy(filter._clauses.select),
    filter.columnNames().map(c => createColumn(c)),
    'deselect temp column',
  );
  t.deepEqual(filter._columns, ['a', 'b', 'c', 'd'], 'filter does not change schema');

  const filterFilter = filter._source;
  onlyContainClsuses(t, filterFilter, ['where']);
  t.deepEqual(
    copy(filterFilter._clauses.where),
    [{type: 'Column', name: '___arquero_sql_predicate___'}],
    'correct filter',
  );
  t.deepEqual(
    filterFilter._columns,
    ['a', 'b', 'c', 'd', '___arquero_sql_predicate___'],
    'filter does not change schema',
  );

  const filterDerive = filterFilter._source;
  onlyContainClsuses(t, filterDerive, ['select']);
  t.deepEqual(filterDerive._source, base, 'filtering with aggregated function wraps the previous query with derive');
  t.deepEqual(
    copy(filterDerive._clauses.select),
    [
      {type: 'Column', name: 'a'},
      {type: 'Column', name: 'b'},
      {type: 'Column', name: 'c'},
      {type: 'Column', name: 'd'},
      {
        type: 'BinaryExpression',
        left: {
          type: 'CallExpression',
          callee: {type: 'Function', name: 'mean'},
          arguments: [{type: 'Column', name: 'a'}],
        },
        operator: '===',
        right: {type: 'Literal', value: 3, raw: '3'},
        as: '___arquero_sql_predicate___',
      },
    ],
    'correct filter',
  );
  t.deepEqual(
    filterDerive._columns,
    ['a', 'b', 'c', 'd', '___arquero_sql_predicate___'],
    'filter does not change schema',
  );

  t.end();
});

tape('verb: filter after groupby', t => {
  const filter = group.filter(d => d.a === 3);
  onlyContainClsuses(t, filter, ['where']);
  t.deepEqual(filter._source, group, 'only filter from previous query');
  t.deepEqual(
    copy(filter._clauses.where),
    [
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '===',
        right: {type: 'Literal', value: 3, raw: '3'},
      },
    ],
    'correct filter',
  );
  t.deepEqual(filter._columns, ['a', 'b', 'c', 'd'], 'filter does not change schema');
  t.deepEqual(filter._group, group._group, 'filter does not change group');

  t.end();
});
