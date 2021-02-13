import tape from 'tape';
import {op} from 'arquero';
import {base, copy, group, onlyContainClsuses, pprint} from './common';

tape('SqlQuery: filter', t => {
  const filter1 = base.filter(d => d.a === 3);
  onlyContainClsuses(t, filter1, ['where']);
  t.deepEqual(filter1._source, base, 'only filter from previous query');
  t.deepEqual(
    copy(filter1._clauses.where),
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
  t.deepEqual(filter1._columns, ['a', 'b', 'c', 'd'], 'filter does not change schema');
  // TODO: test columns

  const filter2 = base.filter(d => op.mean(d.a) === 3);
  onlyContainClsuses(t, filter2, ['select']);
  t.deepEqual(filter2._columns, ['a', 'b', 'c', 'd'], 'filter does not change schema');

  const filter2Filter = filter2._source;
  onlyContainClsuses(t, filter2Filter, ['where']);
  t.deepEqual(
    copy(filter2Filter._clauses.where),
    [{type: 'Column', name: '___arquero_sql_predicate___'}],
    'correct filter',
  );

  const filter2Derive = filter2Filter._source;
  onlyContainClsuses(t, filter2Derive, ['select']);
  t.deepEqual(filter2Derive._source, base, 'filtering with aggregated function wraps the previous query with derive');
  // t.deepEqual(
  //   copy(filter2Derive._clauses.select),
  //   [{type: 'Column', name: '___arquero_sql_predicate___'}],
  //   'correct filter',
  // );
  // TODO: do real testing
  pprint(filter2);

  const filter3 = group.filter(d => op.mean(d.a) === 3);
  // TODO: do real testing
  pprint(filter3);

  // TODO: test reserved column name

  t.end();
});
