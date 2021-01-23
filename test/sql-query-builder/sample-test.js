import tape from 'tape';
import {op} from 'arquero';
import createColumn from '../../src/utils/create-column';
import {base, deepEqualAll, toAst} from './common';

tape('SqlQueryBuilder: orderby', t => {
  const sample = base.sample(10, {replace: false});
  deepEqualAll(t, sample._clauses.select, [
    [createColumn('a'), 'should select original column'],
    [createColumn('b'), 'should select original column'],
    [createColumn('c'), 'should select original column'],
    [createColumn('d'), 'should select original column'],
  ]);

  const orderby = sample._source;
  deepEqualAll(t, orderby._clauses.orderby, [
    [createColumn('___arquero_sql_row_num_tmp___'), 'should orderby temp column'],
  ]);

  const inner = orderby._source;
  t.equals(inner._clauses.limit, 10, 'should limit by the sample size');
  deepEqualAll(t, inner._clauses.orderby, [[toAst(() => op.random()), 'should orderby random']]);
  deepEqualAll(t, inner._clauses.select, [
    [createColumn('a'), 'should select original column'],
    [createColumn('b'), 'should select original column'],
    [createColumn('c'), 'should select original column'],
    [createColumn('d'), 'should select original column'],
    [toAst(() => op.row_number(), '___arquero_sql_row_num_tmp___'), 'should derive temp column from row number'],
  ]);

  t.deepEqual(sample._schema, base._schema, 'schema should stay the same');

  t.throws(() => base.sample(10, {replace: true}), 'sample does not support replace');

  t.end();
});
