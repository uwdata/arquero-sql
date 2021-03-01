/** @typedef {import('../src/sql-query').SqlQuery} SqlQuery */
/** @typedef {import('arquero').internal.ColumnTable} ColumnTable */
import tape from 'tape';
// import {base, base2, base3, group} from './verbs/common';
import {all, not, op, startswith, table} from 'arquero';
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
  const expectedData = expected.reify()._data;
  columns.forEach(c => {
    const _c = c.toLowerCase();
    _actual[_c] = [];
    _expected[_c] = expectedData[c].data;
  });
  client.querySync(actual.toSql()).forEach(r => {
    Object.entries(r).forEach(([c, v], i) => {
      if (columns[i].toLowerCase() !== c.toLowerCase()) {
        t.fail(`incorrect column order: expecting ${columns[i]}, received ${c}`);
      }
      v = typeof v === 'string' ? parseFloat(v) : v;
      v = v === null ? undefined : v;
      _actual[c].push(v);
    });
  });
  t.deepEqual(_actual, _expected, message);
}

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

tape('code-gen: dedupe', t => {
  const client = connectClient();
  const query = base =>
    base.orderby('Seattle').dedupe({
      col1: d => d.Seattle % 10,
    });
  tableEqual(t, ...bases.map(query), 'basic dedupe', client);

  client.end();
  t.end();
});

tape('code-gen: derive', t => {
  const client = connectClient();
  const query = base =>
    base.derive({
      col1: d => d.Seattle + d.Chicago,
      col2: d => op.mean(d.Seattle),
      col3: () => op.row_number(),
    });
  tableEqual(t, ...bases.map(query), 'basic derive', client);

  client.end();
  t.end();
});

tape('code-gen: filter', t => {
  const client = connectClient();
  const query = base => base.filter(d => d.Seattle > 200);
  tableEqual(t, ...bases.map(query), 'basic filter', client);
  tableEqual(t, ...groups.map(query), 'basic filter on grouped query', client);

  const query2 = base =>
    base
      .filter(d => op.mean(d.Chicago) > 200)
      // need to order afterward because PostgreSQL does not preserve original order
      .orderby('Seattle');
  tableEqual(t, ...bases.map(query2), 'filter with aggregated function', client);
  tableEqual(t, ...groups.map(query2), 'filter with aggregated function on grouped query', client);
  client.end();
  t.end();
});

tape('code-gen: groupby', t => {
  const client = connectClient();
  const query = base =>
    base.derive({
      col1: d => d.Seattle + d.Chicago,
    });
  tableEqual(t, ...groups.map(query), 'groupby without aggregate/window derive', client);

  const query2 = base => query(base).rollup().orderby('a');
  tableEqual(t, ...groups.map(query2), 'groupby with empty rollup', client);

  const query3 = base => base.rollup({b: d => op.mean(d.Chicago)}).orderby('a');
  tableEqual(t, ...groups.map(query3), 'groupby with rollup', client);

  client.end();
  t.end();
});

tape('code-gen: sample', t => {
  const client = connectClient();
  const query = baseSql.sample(10).orderby('Seattle');
  const query2 = query.intersect(baseSql);

  t.deepEqual(client.querySync(query.toSql()), client.querySync(query2.toSql()), 'sample from existing rows');

  client.end();
  t.end();
});

tape('code-gen: orderby', t => {
  const client = connectClient();
  const query = base => base.orderby('Chicago');
  tableEqual(t, ...bases.map(query), 'simple order', client);

  const query2 = base =>
    query(base)
      .groupby({key: d => d.Seattle > 200})
      .derive({col: () => op.row_number()});
  tableEqual(t, ...bases.map(query2), 'ordering for window function', client);

  const query3 = base => base.groupby({key: d => d.Seattle > 200}).derive({col: d => op.max(d.Chicago)});
  const query3Sql = base => query3(query(base));
  const query3Arquero = base => query3(base).orderby('Chicago');
  tableEqual(t, query3Sql(baseSql), query3Arquero(baseArquero), 'ordering for aggregation function', client);

  client.end();
  t.end();
});

tape('code-gen: select', t => {
  const client = connectClient();
  const query = base => base.select('Chicago', 'Seattle');
  tableEqual(t, ...bases.map(query), 'simple select', client);

  const query2 = base => base.select(not('Chicago'), 'Chicago');
  tableEqual(t, ...bases.map(query2), 'select not', client);

  const query3 = base => base.select(all());
  tableEqual(t, ...bases.map(query3), 'select all', client);

  const query4 = base => base.select(startswith('S'));
  tableEqual(t, ...bases.map(query4), 'start with', client);

  const query5 = base => base.select('Chicago', 'Seattle', {Seattle: 'Seattle2'});
  tableEqual(t, ...bases.map(query5), 'select with new name', client);

  client.end();
  t.end();
});

tape('code-gen: ungroup', t => {
  const client = connectClient();
  const query = base => base.ungroup().rollup({col: d => op.max(d.Seattle)});
  tableEqual(t, ...bases.map(query), 'ungroup before rollup', client);
  tableEqual(t, ...groups.map(query), 'ungroup before rollup', client);

  client.end();
  t.end();
});

tape('code-gen: join', t => {
  const client = connectClient();
  const chicago = baseSql.select('Seattle', 'Chicago');
  const sanfrancisco = baseSql.select('Seattle', 'San_Francisco');
  tableEqual(
    t,
    chicago.join(sanfrancisco, 'Seattle').orderby('Seattle'),
    baseArquero.orderby('Seattle'),
    'simple join',
    client,
  );
  tableEqual(
    t,
    chicago.join(sanfrancisco, 'Seattle', [all(), all()]).orderby('Seattle_1'),
    baseArquero
      .derive({Seattle_1: d => d.Seattle, Seattle_2: d => d.Seattle})
      .select('Seattle_1', 'Chicago', 'Seattle_2', 'San_Francisco')
      .orderby('Seattle_1'),
    'simple join (with custom output columns)',
    client,
  );

  const [chicagoSql, chicagoArquero] = base1.map(base => base.select('Seattle', 'Chicago'));
  const [sfSql, sfArquero] = base2.map(base => base.select('Seattle', 'San_Francisco'));

  ['inner', 'right', 'left', 'outer'].forEach((joinType, idx) => {
    tableEqual(
      t,
      chicagoSql.join(sfSql, 'Seattle', null, {left: idx >> 1, right: idx & 1}).orderby('Seattle'),
      chicagoArquero.join(sfArquero, 'Seattle', null, {left: idx >> 1, right: idx & 1}).orderby('Seattle'),
      joinType + ' join' + (idx >> 1) + ' ' + (idx & 1),
      client,
    );
  });

  client.end();
  t.end();
});

tape('code-gen', t => {
  // const cg6 = base.join(base3, 'a', [all(), not('e')], {left: true});
  // console.log(codeGen(cg6));

  t.end();
});
