/** @typedef {import('../src/sql-query').SqlQuery} SqlQuery */
/** @typedef {import('arquero').internal.ColumnTable} ColumnTable */
import tape from 'tape';
// import {base, base2, base3, group} from './verbs/common';
import {table} from 'arquero';

import {connectClient, setupTable} from './pg-utils';

const baseArquero = table({
  Seattle: [69, 108, 178, 207, 253, 268, 312, 281, 221, 142, 72, 52],
  Chicago: [135, 136, 187, 215, 281, 311, 318, 283, 226, 193, 113, 106],
  San_Francisco: [165, 182, 251, 281, 314, 330, 300, 272, 267, 243, 189, 156],
});
const baseSql = setupTable(baseArquero, 'base');

const group = base => base.groupby('Seattle');

const bases = [baseSql, baseArquero];
const groups = bases.map(group);

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
