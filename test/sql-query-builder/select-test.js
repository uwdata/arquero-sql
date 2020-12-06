import tape from 'tape';
import {not} from 'arquero';
import {createColumn} from '../../src/utils';
import {Verbs, base, deepEqualAll, noschema} from './common';

tape('SqlQueryBuilder: select', t => {
  const derive1 = base.select(Verbs.select(['a', 'b']));

  deepEqualAll(t, derive1._clauses.select, [
    [createColumn('a'), 'should include selected column'],
    [createColumn('b'), 'should include selected column'],
  ]);
  t.deepEqual(derive1._schema.columns, ['a', 'b'], 'should produce correct schema');

  const derive2 = base.select(Verbs.select([not('a', 'b'), 'b']));

  deepEqualAll(t, derive2._clauses.select, [
    [createColumn('c'), 'should include selected column'],
    [createColumn('d'), 'should include selected column'],
    [createColumn('b'), 'should include selected column'],
  ]);
  t.deepEqual(derive2._schema.columns, ['c', 'd', 'b'], 'should produce correct schema');

  t.throws(() => noschema.select(not('b', 'b')), "Cannot select with 'all' or 'not' without schema");

  t.end();
});
