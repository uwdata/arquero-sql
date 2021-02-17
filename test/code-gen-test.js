/** @typedef {import('../src/sql-query').SqlQuery} SqlQuery */
/** @typedef {import('arquero').internal.ColumnTable} ColumnTable */
import tape from 'tape';
// import {base, base2, base3, group} from './verbs/common';
import {op, table} from 'arquero';

import {connectClient, setupTable} from './pg-utils';

const baseArquero = table({
  Seattle: [69, 108, 178, 207, 253, 268, 312, 281, 221, 142, 72, 52],
  Chicago: [135, 136, 187, 215, 281, 311, 318, 283, 226, 193, 113, 106],
  San_Francisco: [165, 182, 251, 281, 314, 330, 300, 272, 267, 243, 189, 156],
});
const baseSql = setupTable(baseArquero, 'base');

const group = base => base.groupby({a: d => d.Seattle % 10});

const bases = [baseSql, baseArquero];
const groups = bases.map(group);
const [groupSql, groupArquero] = groups;

const base1 = bases.map(b => b.filter(d => d.Seattle > 150));
const [baseSql1, baseArquero1] = base1;
const base2 = bases.map(b => b.filter(d => d.Seattle < 200));
const [baseSql2, baseArquero2] = base2;

/**
 *
 * @param {object} t
 * @param {SqlQuery} actual
 * @param {ColumnTable} expected
 * @param {string} message
 * @param {*} [client]
 */
function tableEqual(t, actual, expected, message, client) {
  if (!client) {
    client = connectClient();
  }

  const columns = expected.columnNames();
  const _actual = {};
  const _expected = {};
  const expectedData = JSON.parse(expected.toJSON()).data;
  columns.forEach(c => {
    const _c = c.toLowerCase();
    _actual[_c] = [];
    _expected[_c] = expectedData[c];
  });
  console.log(actual.toSql());
  client.querySync(actual.toSql()).forEach(r => {
    Object.entries(r).forEach(([c, v], i) => {
      if (columns[i].toLowerCase() !== c.toLowerCase()) {
        t.fail(`incorrect column order: expecting ${columns[i]}, received ${c}`);
      }
      _actual[c].push(v);
    });
  });
  t.deepEqual(_actual, _expected, message);
}

tape('code-gen: filter', t => {
  const client = connectClient();
  const filter = base => base.filter(d => d.Seattle > 200);
  tableEqual(t, ...bases.map(filter), 'same result as arquero', client);
  tableEqual(t, ...groups.map(filter), 'same result as arquero', client);

  const filter2 = base =>
    base
      .filter(d => op.mean(d.Chicago) > 200)
      // need to order afterward because PostgreSQL does not preserve original order
      .orderby('Seattle');
  tableEqual(t, ...bases.map(filter2), 'same result as arquero', client);
  tableEqual(t, ...groups.map(filter2), 'same result as arquero', client);
  client.end();
  t.end();
});

tape('code-gen: union', t => {
  const client = connectClient();
  // const b = [[baseSql, [baseSql1]], [baseArquero, [baseArquero1]]];
  tableEqual(
    t,
    baseSql1.union(baseSql2).orderby('Seattle'),
    baseArquero1.union(baseArquero2).orderby('Seattle'),
    'same result as arquero',
    client,
  );
  tableEqual(
    t,
    groupSql.union(baseSql2).orderby('Seattle'),
    groupArquero.union(baseArquero2).orderby('Seattle'),
    'same result as arquero',
    client,
  );
  client.end();
  t.end();
});

tape('code-gen', t => {
  // TODO: do real testing

  // const cg1 = base.filter(d => d.a !== 2);
  // console.log(codeGen(cg1));

  // const cg2 = group.filter(d => op.mean(d.c) === 5);
  // console.log(codeGen(cg2));

  // const cg3 = group.rollup({f: d => op.mean(d.c)});
  // console.log(codeGen(cg3));

  // const cg4 = group.dedupe('c', 'b');
  // console.log(codeGen(cg4));

  // const cg5 = base.concat(base2, base3);
  // console.log(codeGen(cg5));

  // const cg6 = base.join(base3, 'a', [all(), not('e')], {left: true});
  // console.log(codeGen(cg6));

  // const cg7 = base.sample(5);
  // console.log(codeGen(cg7));

  // const cg8 = base.orderby(d => d.a + 2, 'b', desc('c'));
  // console.log(codeGen(cg8));

  t.end();
});
