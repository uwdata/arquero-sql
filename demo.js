const { all, desc, op, table } = require('arquero');
const {SqlQuery} = require('./dist/arquero-sql');

// Average hours of sunshine per month, from https://usclimatedata.com/.
const dt = table({
  'Seattle': [69,108,178,207,253,268,312,281,221,142,72,52],
  'Chicago': [135,136,187,215,281,311,318,283,226,193,113,106],
  'San Francisco': [165,182,251,281,314,330,300,272,267,243,189,156]
});
// Arquero-SQL
const q = new SqlQuery('table', {}, {columns: ['Seattle', 'Chicago', 'San Francisco']});

// Sorted differences between Seattle and Chicago.
// Table expressions use arrow function syntax.
dt.derive({
    month: d => op.row_number(),
    diff:  d => d.Seattle - d.Chicago
  })
  .select('month', 'diff')
  .orderby(desc('diff'))
  .print();
// Arquero-SQL
const q1 = q.derive({
    month: d => op.row_number(),
    diff:  d => d.Seattle - d.Chicago
  })
  .select('month', 'diff')
  .orderby(desc('diff'))
  .toSql();
console.log(q1);

// Is Seattle more correlated with San Francisco or Chicago?
// Operations accept column name strings outside a function context.
dt.rollup({
    corr_sf:  op.corr('Seattle', 'San Francisco'),
    corr_chi: op.corr('Seattle', 'Chicago')
  })
  .print();
// Arquero-SQL
const q2 = q.rollup({
    corr_sf:  op.corr('Seattle', 'San Francisco'),
    corr_chi: op.corr('Seattle', 'Chicago')
  })
  .toSql();
console.log(q2);

// Aggregate statistics per city, as output objects.
// Reshape (fold) the data to a two column layout: city, sun.
dt.fold(all(), { as: ['city', 'sun'] })
  .groupby('city')
  .rollup({
    min:  d => op.min(d.sun), // functional form of op.min('sun')
    max:  d => op.max(d.sun),
    avg:  d => op.average(d.sun),
    med:  d => op.median(d.sun),
    // functional forms permit flexible table expressions
    skew: ({sun: s}) => (op.mean(s) - op.median(s)) / op.stdev(s) || 0
  })
  .objects()
// Arquero-SQL does not support fold
const q3 = q.groupby({s: d => d.Seattle % 10})
  .rollup({
    min:  d => op.min(d.Chicago), // functional form of op.min('sun')
    max:  d => op.max(d.Chicago),
    avg:  d => op.average(d.Chicago),
    // TODO: PostgresQL does not support median, so we need to define or do some desugaring
    // or extract meadian from joining other table: https://stackoverflow.com/questions/39683330/percentile-calculation-with-a-window-function
    med:  d => op.median(d.Chicago),
    // functional forms permit flexible table expressions
    skew: ({Chicago: s}) => (op.mean(s) - op.median(s)) / op.stdev(s) || 0
  })
  .toSql();
console.log(q3);