// Arquero.js
const {table, view, internal: {QueryBuilder, Verbs}, op, not, desc, all} = require('arquero');
// main IR/translator
const {SqlQueryBuilder} = require('./dist/arquero-sql')

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

const t1 = test
  .filter([d => d.Seattle > 100, d => d.Chicago > 90])
  .select(['Chicago'])
//console.log(t1.optimize().toSql())

dt
  // filter selected column with condition
  .filter(d => d.Seattle > 100 && d.Chicago > 90)
  // select the column
  .select('Chicago')
  //.print({limit : 12})

// ####################################################################################################################### //

const t2 = test
  // group by just like in SQL
  .groupby(['Seattle', 'Chicago'])
  .rollup({mean : d => op.mean(d.Seattle),
    sum : d => d.Seattle + d.Chicago});
console.log(t2.optimize().toSql())

dt
  // group by just like in SQL
  .groupby('Seattle', 'Chicago')
  // generate new column based on the group by
  .rollup({mean : d => op.mean(d.Seattle)})
  .derive({
    sum : d => d.Seattle + d.Chicago
  })
  //.print({limit : 12})

// ####################################################################################################################### //

const t3 = test
  .select(['Seattle'])
  .orderby([{key1 : d => d.Seattle}])
console.log(t3.optimize().toSql())

dt
  .select('Seattle')
  // order by like in SQL
  .orderby(['Seattle'])
  .print({limit : 12})
