import tape from 'tape';
import {not} from 'arquero';
import createColumn from '../../src/utils/create-column';
import {base, copy, deepEqualAll, noschema} from './common';

function includeColumn(name) {
  return [createColumn(name), 'should include selected column'];
}

tape('SqlQueryBuilder: select', t => {
  const columns1 = ['a', 'b'];
  const select1 = base.select(columns1);
  deepEqualAll(t, select1._clauses.select, columns1.map(includeColumn));
  t.deepEqual(select1._schema.columns, ['a', 'b'], 'should produce correct schema');

  const select2 = base.select([not('a', 'b'), 'b']);
  deepEqualAll(t, select2._clauses.select, ['c', 'd', 'b'].map(includeColumn));
  t.deepEqual(select2._schema.columns, ['c', 'd', 'b'], 'should produce correct schema');

  const select4 = base.select(...columns1);
  t.deepEqual(copy(select4), copy(select1), 'should allow flattened parameters');

  t.throws(() => noschema.select([not('a', 'b')]), "Cannot select with 'all' or 'not' without schema");

  t.end();
});
