import tape from './tape-wrapper';
// import {SqlQueryBuilder} from '../src';
// import {all} from 'arquero';
// import {copy, toAst} from './sql-db-table/common';
// import createColumn from '../src/utils/create-column';

tape('optimizer', t => {
  // const table = new SqlQueryBuilder('table', null, {columns: ['Seattle', 'Chicago', 'New York']});

  // const t0 = table.select(['Chicago']).filter({condition: d => d.Seattle > 100});
  // const fused_t0 = t0.optimize();
  // t.deepEqual(fused_t0._source._source.name, t0._source._source._source.name, 'should fuse inner most table');
  // fused_t0._source._source = null;
  // t0._source._source = null;
  // t.deepEqual(copy(fused_t0), copy(t0), 'should not fuse if inner query has execution order higher than the outer one');

  // const t1 = table.filter({condition: d => d.Seattle > 100}).select(['Chicago']);
  // const fused_t1 = t1.optimize();
  // t.equal(fused_t1._source, 'table', 'should have correct inner-most table');
  // t.deepEqual(
  //   copy(fused_t1._clauses.where),
  //   copy([toAst(d => d.Seattle > 100, 'condition')]),
  //   'should have where on the top-most level',
  // );
  // t.deepEqual(fused_t1._clauses.select, [createColumn('Chicago')], 'should have select on the top-most level');

  // const t2 = table.select([all()]).select(['Seattle', 'Chicago']).select(['Seattle']);
  // const fused_t2 = t2.optimize();
  // t.equal(fused_t2._source, 'table', 'should have correct inner-most table');
  // t.deepEqual(fused_t2._clauses.select, [createColumn('Seattle')], 'Should use the outer-most select');

  // const t3 = table.filter({condition1: d => d.Seattle > 100}).filter({condition2: d => d.Chicago > 100});
  // const fused_t3 = t3.optimize();
  // t.equal(fused_t3._source, 'table', 'should have correct inner-most table');
  // t.deepEqual(
  //   copy(fused_t3._clauses.where),
  //   copy([toAst(d => d.Chicago > 100, 'condition2'), toAst(d => d.Seattle > 100, 'condition1')]),
  //   'Should use the outer-most select',
  // );

  t.end();
});
