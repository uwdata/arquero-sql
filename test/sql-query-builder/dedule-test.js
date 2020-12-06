import tape from 'tape';
import {all, not} from 'arquero';
import {Verbs, base} from './common';

tape('SqlQueryBuilder: select', t => {
  const dedupe = base.dedupe(Verbs.dedupe(all()));
  t.ok(dedupe._clauses.distinct, 'distinct flag should be true');
  t.deepEqual(dedupe._schema.columns, base._schema.columns, 'schema should stay the same');

  t.throws(() => base.dedupe(Verbs.dedupe(not('b', 'b'))), 'SQL can only dedupe all fields');

  t.end();
});
