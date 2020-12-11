import tape from 'tape';
import {all, not} from 'arquero';
import {base} from './common';

tape('SqlQueryBuilder: dedupe', t => {
  const dedupe = base.dedupe(all());
  t.ok(dedupe._clauses.distinct, 'distinct flag should be true');
  t.deepEqual(dedupe._schema.columns, base._schema.columns, 'schema should stay the same');

  t.throws(() => base.dedupe(not('b', 'b')), 'SQL can only dedupe all fields');

  t.end();
});
