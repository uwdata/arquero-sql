import tape from 'tape';
import {SqlQuery} from '../src';
import {copy} from './sql-query-builder/common';
import * as verbs from '../src/verbs/index';
import {op} from 'arquero';

tape('sql-query', t => {
  const table1 = new SqlQuery('table1', ['Seattle', 'Chicago', 'New York']);
  const table2 = new SqlQuery('table2', ['Seattle', 'Chicago', 'New York']);
  const table3 = new SqlQuery('table3', ['Seattle', 'Chicago', 'New York']);

  let actual, expected;

  actual = table1.concat(table2, table3);
  expected = verbs.concat(table1, [table2, table3]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: concat');

  actual = table1.except(table2, table3);
  expected = verbs.except(table1, [table2, table3]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: except');

  actual = table1.intersect(table2, table3);
  expected = verbs.intersect(table1, [table2, table3]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: intersect');

  actual = table1.union(table2, table3);
  expected = verbs.union(table1, [table2, table3]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: union');

  actual = table1.count({as: 'c'});
  expected = verbs.count(table1, {as: 'c'});
  t.deepEqual(copy(actual), copy(expected), 'correct interface: count');

  actual = table1.dedupe('k1', {k2: d => d.k + 1});
  expected = verbs.dedupe(table1, ['k1', {k2: d => d.k + 1}]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: dedupe');
  actual = table1.dedupe(['k1'], {k2: d => d.k + 1});
  expected = verbs.dedupe(table1, ['k1', {k2: d => d.k + 1}]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: dedupe');

  actual = table1.derive({k3: d => d.k1 + d.k2});
  expected = verbs.derive(table1, {k3: d => d.k1 + d.k2});
  t.deepEqual(copy(actual), copy(expected), 'correct interface: derive');

  actual = table1.filter(d => d.k1 + d.k2);
  expected = verbs.filter(table1, d => d.k1 + d.k2);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: filter');

  actual = table1.groupby('k1', {k2: d => d.k + 1});
  expected = verbs.groupby(table1, ['k1', {k2: d => d.k + 1}]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: groupby');
  actual = table1.groupby(['k1'], {k2: d => d.k + 1});
  expected = verbs.groupby(table1, ['k1', {k2: d => d.k + 1}]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: groupby');

  actual = table1.join(table2, ['Seattle', 'Chicago'], [['Chicago'], ['Seattle']], {left: true, suffix: ['_0', '_1']});
  expected = verbs.join(table1, table2, ['Seattle', 'Chicago'], [['Chicago'], ['Seattle']], {
    left: true,
    suffix: ['_0', '_1'],
  });
  t.deepEqual(copy(actual), copy(expected), 'correct interface: join');

  actual = table1.orderby(['k1'], d => d.k + 1, {k2: d => d.k + 1});
  expected = verbs.orderby(table1, ['k1', d => d.k + 1, {k2: d => d.k + 1}]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: orderby');

  actual = table1.rollup({k3: d => op.mean(d.k1 + d.k2)});
  expected = verbs.rollup(table1, {k3: d => op.mean(d.k1 + d.k2)});
  t.deepEqual(copy(actual), copy(expected), 'correct interface: rollup');

  actual = table1.sample(5);
  expected = verbs.sample(table1, 5);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: sample');

  actual = table1.select('Seattle', {c: 'Chicago'});
  expected = verbs.select(table1, ['Seattle', {c: 'Chicago'}]);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: select');

  actual = table1.ungroup();
  expected = verbs.ungroup(table1);
  t.deepEqual(copy(actual), copy(expected), 'correct interface: ungroup');

  t.end();
});
