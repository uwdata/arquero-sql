import tape from 'tape';
import {SqlQuery} from '../src';
import {copy} from './sql-query-builder/common';
import * as verbs from '../src/verbs/index';
import {op} from 'arquero';

/**
 *
 * @param {tape.Test} t
 * @param {string} verb
 * @param {SqlQuery} base
 * @param {any[]} expected
 * @param {any[]} actual
 */
function testInterface(t, verb, base, actual, expected) {
  actual = copy(base[verb](...actual));
  expected = copy(verbs[verb](base, ...expected));
  t.deepEqual(actual, expected, 'correct interface: ' + verb);
}

tape('sql-query', t => {
  const table1 = new SqlQuery('table1', null, {columns: ['Seattle', 'Chicago', 'New York']});
  const table2 = new SqlQuery('table2', null, {columns: ['Seattle', 'Chicago', 'New York']});
  const table3 = new SqlQuery('table3', null, {columns: ['Seattle', 'Chicago', 'New York']});

  testInterface(t, 'concat', table1, [table2, table3], [[table2, table3]]);
  testInterface(t, 'except', table1, [table2, table3], [[table2, table3]]);
  testInterface(t, 'intersect', table1, [table2, table3], [[table2, table3]]);
  testInterface(t, 'union', table1, [table2, table3], [[table2, table3]]);

  testInterface(t, 'count', table1, [], []);

  testInterface(t, 'dedupe', table1, ['k1', {k2: d => d.k + 1}], [['k1', {k2: d => d.k + 1}]]);
  testInterface(t, 'dedupe', table1, [['k1'], {k2: d => d.k + 1}], [['k1', {k2: d => d.k + 1}]]);

  testInterface(t, 'derive', table1, [{k3: d => d.k1 + d.k2}], [{k3: d => d.k1 + d.k2}]);

  testInterface(t, 'filter', table1, [d => d.k1 + d.k2], [d => d.k1 + d.k2]);

  testInterface(t, 'groupby', table1, ['k1', {k2: d => d.k + 1}], [['k1', {k2: d => d.k + 1}]]);
  testInterface(t, 'groupby', table1, [['k1'], {k2: d => d.k + 1}], [['k1', {k2: d => d.k + 1}]]);

  testInterface(
    t,
    'join',
    table1,
    [table2, ['Seattle', 'Chicago'], [['Chicago'], ['Seattle']], {left: true, suffix: ['_0', '_1']}],
    [table2, ['Seattle', 'Chicago'], [['Chicago'], ['Seattle']], {left: true, suffix: ['_0', '_1']}],
  );

  testInterface(
    t,
    'orderby',
    table1,
    [['k1'], d => d.k + 1, {k2: d => d.k + 1}],
    [['k1', d => d.k + 1, {k2: d => d.k + 1}]],
  );

  testInterface(t, 'rollup', table1, [{k3: d => op.mean(d.k1 + d.k2)}], [{k3: d => op.mean(d.k1 + d.k2)}]);

  testInterface(t, 'sample', table1, [5], [5]);

  testInterface(t, 'select', table1, ['Seattle', {c: 'Chicago'}], [['Seattle', {c: 'Chicago'}]]);

  t.end();
});
