import tape from 'tape';
import {SqlQueryBuilder, fuse} from '../src';
import {all, internal} from 'arquero';
import {copy, toAst} from './sql-query-builder/common';
import {createColumn} from '../src/utils';
const {Verbs} = internal;

tape('optimizer', t => {
  const table = new SqlQueryBuilder('table', null, {columns: ['Seattle', 'Chicago', 'New York']});

  const t0 = table.select(Verbs.select(['Chicago'])).filter(Verbs.filter({condition: d => d.Seattle > 100}));
  const fused_t0 = fuse(t0);
  t.deepEqual(fused_t0._source._source.name, t0._source._source._source.name, 'should fuse inner most table');
  fused_t0._source._source = null;
  t0._source._source = null;
  t.deepEqual(copy(fused_t0), copy(t0), 'should not fuse if inner query has execution order higher than the outer one');

  const t1 = table.filter(Verbs.filter({condition: d => d.Seattle > 100})).select(Verbs.select(['Chicago']));
  const fused_t1 = fuse(t1);
  t.equal(fused_t1._source.name, 'table', 'should have correct inner-most table');
  t.deepEqual(
    copy(fused_t1._clauses.where),
    copy([toAst(d => d.Seattle > 100, 'condition')]),
    'should have where on the top-most level',
  );
  t.deepEqual(fused_t1._clauses.select, [createColumn('Chicago')], 'should have select on the top-most level');

  const t2 = table
    .select(Verbs.select([all()]))
    .select(Verbs.select(['Seattle', 'Chicago']))
    .select(Verbs.select(['Seattle']));
  const fused_t2 = fuse(t2);
  t.equal(fused_t2._source.name, 'table', 'should have correct inner-most table');
  t.deepEqual(fused_t2._clauses.select, [createColumn('Seattle')], 'Should use the outer-most select');

  const t3 = table
    .filter(Verbs.filter({condition1: d => d.Seattle > 100}))
    .filter(Verbs.filter({condition2: d => d.Chicago > 100}));
  const fused_t3 = fuse(t3);
  t.equal(fused_t3._source.name, 'table', 'should have correct inner-most table');
  t.deepEqual(
    copy(fused_t3._clauses.where),
    copy([toAst(d => d.Chicago > 100, 'condition2'), toAst(d => d.Seattle > 100, 'condition1')]),
    'Should use the outer-most select',
  );

  t.end();
});
