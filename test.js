const {table, internal: {QueryBuilder}, op, desc} = require('arquero');
const {toSql} = require('./dist/arquero-sql');

const dt = table({
  'Seattle': [69,108,178,207,253,268,312,281,221,142,72,52],
  'Chicago': [135,136,187,215,281,311,318,283,226,193,113,106],
  'San Francisco': [165,182,251,281,314,330,300,272,267,243,189,156]
});

// dt.print();

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
  .rollup({a: d => op.max(d.key + d.key2)})
  .rollup({b: op.mean('Seattle')})
  .rollup({c: op.count()})
  .count({as: 'c'})
  .count()
  .orderby(desc(d => d.Seattle))
  .orderby('Seattle', desc(d => d['Chicago']))
  .orderby(desc('Chicago'))

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