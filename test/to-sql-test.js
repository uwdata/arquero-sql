import tape from './tape-wrapper';
// import {SqlDBTable} from '../src';
// import {internal} from 'arquero';
// const {Verbs} = internal;

tape('to-sql : well printed', t => {
  // const test = new SqlDBTable(
  //   'table',
  //   null,
  //   // Verbs.select(['d => mean(d.foo)'])},
  //   ['Seattle', 'Chicago', 'New York'],
  // );
  // const t1 = test.select(Verbs.select(['Chicago'])).filter(Verbs.filter({condition: d => d.Seattle > 100}));

  // t.deepEqual(t1.toSql());
  t.end();
});
