/** @typedef {import('../src/sql-query').SqlQuery} SqlQuery */
/** @typedef {import('arquero').internal.ColumnTable} ColumnTable */
import tape from 'tape';
// import {base, base2, base3, group} from './verbs/common';
import {op, table} from 'arquero';
import {types} from 'pg';

import {connectClient, setupTable} from './pg-utils';

types.setTypeParser(types.builtins.FLOAT4, val => parseFloat(val));
types.setTypeParser(types.builtins.FLOAT8, val => parseFloat(val));

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
  client.querySync(actual.toSql()).forEach(r => {
    Object.entries(r).forEach(([c, v], i) => {
      if (columns[i].toLowerCase() !== c.toLowerCase()) {
        t.fail(`incorrect column order: expecting ${columns[i]}, received ${c}`);
      }
      v = typeof v === 'string' ? parseFloat(v) : v;
      _actual[c].push(v);
    });
  });
  t.deepEqual(_actual, _expected, message);
}

tape('code-gen: filter', t => {
  const client = connectClient();
  const filter = base => base.filter(d => d.Seattle > 200);
  tableEqual(t, ...bases.map(filter), 'basic filter', client);
  tableEqual(t, ...groups.map(filter), 'basic filter on grouped query', client);

  const filter2 = base =>
    base
      .filter(d => op.mean(d.Chicago) > 200)
      // need to order afterward because PostgreSQL does not preserve original order
      .orderby('Seattle');
  tableEqual(t, ...bases.map(filter2), 'filter with aggregated function', client);
  tableEqual(t, ...groups.map(filter2), 'filter with aggregated function on grouped query', client);
  client.end();
  t.end();
});

// TODO: PostgreSQL does not have CONCAT
['intersect', 'except', 'union'].map(v => {
  tape('code-gen: ' + v, t => {
    const client = connectClient();
    tableEqual(
      t,
      baseSql1[v](baseSql2).orderby('Seattle'),
      baseArquero1[v](baseArquero2).orderby('Seattle'),
      'basic ' + v,
      client,
    );
    tableEqual(
      t,
      groupSql[v](baseSql2).orderby('Seattle'),
      groupArquero[v](baseArquero2).orderby('Seattle'),
      'ungroup before ' + v,
      client,
    );
    client.end();
    t.end();
  });
});

tape('code-gen: derive', t => {
  const client = connectClient();
  const derive = base =>
    base.derive({
      col1: d => d.Seattle + d.Chicago,
      col2: d => op.mean(d.Seattle),
      col3: () => op.row_number(),
    });
  tableEqual(t, ...bases.map(derive), 'basic derive', client);

  client.end();
  t.end();
});

tape('code-gen: groupby', t => {
  const client = connectClient();
  const groupby = base =>
    base.derive({
      col1: d => d.Seattle + d.Chicago,
    });
  tableEqual(t, ...groups.map(groupby), 'groupby without aggregate/window derive', client);

  const groupby2 = base => groupby(base).rollup().orderby('a');
  tableEqual(t, ...groups.map(groupby2), 'groupby with empty rollup', client);

  const groupby3 = base => base.rollup({b: d => op.mean(d.Chicago)}).orderby('a');
  tableEqual(t, ...groups.map(groupby3), 'groupby with rollup', client);

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
