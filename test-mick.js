const {table, internal: {Query, Verbs}, op, not, desc, all, range, matches, startswith, endswith} = require('arquero');
const {toSql} = require('./dist/arquero-sql');
const {SqlQuery} = require('./dist/arquero-sql');

const dt = table({
  'Seattle': [69,108,178,207,253,268,312,281,221,142,72,52],
  'Chicago': [135,136,187,215,281,311,318,283,226,193,113,106],
  'San Francisco': [165,182,251,281,314,330,300,272,267,243,189,156]
});

// dt.derive({d: d => op.mean(d.Chicago)}).print()

dt
  .filter(d => op.mean(d.Chicago) > 140 || d.Seattle > 100)  // is not allowed in SQL
  .groupby({key: d => d.Seattle > 100, S: d => d.Seattle}, 'Seattle')
  // .derive({k: d => d.Chicago + 10})
  // .filter(d => op.mean(d.Chicago) > 140)  // should becomes "having"
  // .filter(d => d.Chicago > 200) // tricky case -> should becomes "where"
  // .select('key')
  .rollup({key: d => op.mean(d.Chicago) + 1000})
  // .select('Seattle')
  // .select(not('Seattle'), 'Seattle')
  .print();

// dt.print()
dt
  .filter(d => d.Seattle > 100)
  .orderby('Chicago')
  // .select('Seattle')
  .derive({ Chicago: d => 2, Seattle: d => 1})
  // .lookup(dt.derive({Seattle1: d => d.Seattle + 1000}), ['Chicago', 'Chicago'], ['Seattle1'])
  // .select(not(not('Seattle')), 'Chicago', 'Seattle')
  // .dedupe(not('Seattle', 'San Francisco'))
  // .select(not('Seattle'), 'Seattle', {Seattle: 'Seattle2'}, 'Chicago')
  // .select('Seattle', 'Chicago', {Seattle: 'Seattle1'}, 'Seattle', {Seattle: 'Seattle2'})
  .groupby(not('Seattle'), {k: d => d.Seattle + d.Chicago})
  .count()
  // .print()

dt
  .select('Seattle', 'Chicago')
  .join(dt.select('Chicago', 'San Francisco'), ['Chicago', 'Chicago'], null, {suffix: ['_1', '2']})
  .print()

// console.log(Verbs.select('d', 'ddd', all()).toAST())

function dd(d) {
  return d.Seattle * d.Chicago
}

const qb = new Query();

const out = qb
  .derive({
    a: d => d.Seattle + -d.Chicago,
    b: d => d.Seattle + d.Chicago,
    c: d => d.Chicago,
    d: _ => _,
    e: d => (d.Seattle > 10 ? 'hi' : 'test') === 'hi',
    // f: d => {  // will not support
    //   let a = 10;
    //   const b = 20;
    //   return d.Seattle > a || d.Chicago > b;
    // },
    // g: op.row_number(),
    h: d => d['Seattle'] > 10,
    i: d => `${d.Seattle} + ${d.Chicago}`,
  })
  .filter(d => d.Seattle > 100)
  // .groupby('Seattle', 'Chicago')
  // .groupby({key: d => d.Seattle + d.Chicago})
  // .groupby({key: d => d.Seattle + d.Chicago, k: d => d.Seattle}, 'Seattle')
  // .rollup({a: d => op.max(d.key + d.key2)})
  // .rollup({b: op.mean('Seattle')})
  .rollup({c: op.count()})
  .count({as: 'c'})
  .count()
  // .orderby(desc(d => d.Seattle + d.Chicago))
  // .orderby('Seattle', desc(d => d['Chicago']))
  // .orderby(desc('Chicago'))
  // .lookup("hi", (a, b) => op.equal(a.Seattle, b.Chicago), [not('test1')])
  // .select(all())
  // .sample(5, {replace: true})
  // .dedupe('a')
  // .dedupe({abd: d => d.b})
  // .concat('test2')
  // .count({as: 'jk'})
  // .concat(['tableq', 'table2'])
  // .dedupe(all())
  .join('test', ['ke1'], [[], []])
  .join('test', (a, b) => a.d + b.d === 4, [[not('a')], 'b'], {left: true, suffix: ['-1']})
  .join('test', ['a', 'b'], [[not('a')], 'b'])
  .join('test', ['a', 'b'], [[not('a')], ['b', {d: d => d.Seattle + 4, d1: d => d.Seattle}]])
  // .select('hi', all())
  .join('other', (a, b) => a.c1 === b.c2, [[], []])
  .select([1, 'test', all(), not('e', 1), range('s', 'b'), matches(/123/), startswith('sdf'), endswith('werw')])
  .select('d')


console.log(JSON.stringify(out._verbs, null, 3));
console.log(out._verbs[out._verbs.length - 1])
// console.log(JSON.stringify(fromQuery(out, null), null, 3));
console.log(JSON.stringify(out.toAST(), null, 3));

// console.log(JSON.stringify(out.toAST().verbs.map(v => {
// // v.values.map(vv => toSql(vv))
//   return {
//     verb: v.verb,
//     ...Object.keys(v)
//       .filter(k => k !== 'type' && k !== 'verb')
//       .reduce((acc, k) => ({
//         ...acc,
//         [k]: Array.isArray(v[k])
//           ? v[k].map(vv => toSql(vv))
//           : toSql(v[k])
//       }), {})
//   }
// }), null, 2));

// const out2 = qb
//   .filter(d => d.Seattle > 100)
//   .groupby('Seattle')
//   .rollup({max_Chicago: d => op.max(d.Chicago)})
//   .orderby(desc(d => d.Seattle))
//   .join((new QueryBuilder("test")), (a, b) => op.equal(a.Seattle, b.Chicago), ['test1'])
// console.log(JSON.stringify(out.toAST(), null, 2));

const sqlQuery = new SqlQuery(
    'table',
    {except: (['table1', 'table2']),
        select: [Verbs.select('a').toAST().columns[0],
            Verbs.derive({b: d => d.a + 1}).toAST().values[0]],
        where: [Verbs.filter(d => d.a > 0)],
        having: [Verbs.filter(d => op.mean(d.a))]},
    // Verbs.select(['d => mean(d.foo)'])},
    'foo'
)

// console.log(sqlQuery.toSql());