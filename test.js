// Arquero.js
// eslint-disable-next-line no-unused-vars
const {table, view, internal: {QueryBuilder, Verbs}, op, not, desc, all} = require('arquero');
// main IR/translator
const {SqlQueryBuilder} = require('./dist/arquero-sql');

// actual table values
const dt = table({
  'Seattle': [69,108,178,207,253,268,312,281,221,142,72,52],
  'Chicago': [135,136,187,215,281,311,318,283,226,193,113,106],
  'New York': [165,182,251,281,314,330,300,272,267,243,189,156]
});
//dt.print({limit : 12})

// constructor of the query collector
const test = new SqlQueryBuilder(
  'a1',
  null,
  { columns: ['Seattle', 'Chicago', 'New York']}
);

// ####################################################################################################################### //

// SqlQuery
const t1 = test
  .filter([d => d.Seattle > 100, d => d.Chicago > 90])
  .select(['Chicago']);
console.log(t1.optimize().toSql());

dt
  .filter(d => d.Seattle > 100 && d.Chicago > 90)
  .select('Chicago')
    .print();

// ####################################################################################################################### //

// eslint-disable-next-line no-unused-vars
const t2 = test
  // group by just like in SQL
  .groupby(['Seattle', 'Chicago'])
  .rollup({mean : d => op.mean(d.Seattle),
    sum : d => d.Seattle + d.Chicago});
console.log(t2.optimize().toSql());

dt
  .groupby('Seattle', 'Chicago')
  .rollup({mean : d => op.mean(d.Seattle)})
  .derive({
       sum : d => d.Seattle + d.Chicago
  })
  .print({limit : 12});

// ####################################################################################################################### //

dt
    .filter(d => d.Chicago > 200)
    .orderby('Seattle')
    .print()

const t3 = test
    .filter([d => d.Chicago > 200])
    .orderby(['Seattle'])
console.log(t3.optimize().toSql())
