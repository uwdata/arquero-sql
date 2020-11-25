const {table, internal: {QueryBuilder}, op, not, desc, all} = require('arquero');
const {toSql} = require('./dist/arquero-sql');

const dt = table({
  'Seattle': [69,108,178,207,253,268,312,281,221,142,72,52],
  'Chicago': [135,136,187,215,281,311,318,283,226,193,113,106],
  'San Francisco': [165,182,251,281,314,330,300,272,267,243,189,156]
});

// dt.derive({d: d => op.mean(d.Chicago)}).print()

dt
  .filter(d => op.mean(d.Chicago) > 140)  // is not allowed in SQL
  .groupby({key: d => d.Seattle > 100, S: d => d.Seattle}, 'Seattle')
  // .derive({k: d => d.Chicago + 10})
  // .filter(d => op.mean(d.Chicago) > 140)  // should becomes "having"
  // .filter(d => d.Chicago > 200) // tricky case -> should becomes "where"
  // .select('key')
  .rollup({mean_chicago: d => op.mean(d.Chicago)})
  .print();

dt
  .filter(d => d.Seattle > 100)
  .orderby('Chicago')
  .select('Seattle')
  .lookup(dt, ['Seattle', 'Seattle'], [not('Chicago')])
  .print()

function dd(d) {
  return d.Seattle * d.Chicago
}

const qb = new QueryBuilder("test");

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
    g: op.row_number(),
    h: d => d['Seattle'] > 10,
    i: d => `${d.Seattle} + ${d.Chicago}`
  })
  .filter(d => d.Seattle > 100)
  .groupby('Seattle', 'Chicago')
  .groupby({key: d => d.Seattle + d.Chicago})
  .groupby({key: d => d.Seattle + d.Chicago, k: d => d.Seattle}, 'Seattle')
  // .rollup({a: d => op.max(d.key + d.key2)})
  // .rollup({b: op.mean('Seattle')})
  // .rollup({c: op.count()})
  // .count({as: 'c'})
  // .count()
  // .orderby(desc(d => d.Seattle))
  // .orderby('Seattle', desc(d => d['Chicago']))
  // .orderby(desc('Chicago'))
  .lookup((new QueryBuilder("test")), (a, b) => op.equal(a.Seattle, b.Chicago), [not('test1')])
  .select(not('col1', not('col2')), 'col2')

console.log(JSON.stringify(out.toAST(), null, 2));

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