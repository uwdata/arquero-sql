import tape from 'tape';
// import {op} from 'arquero';
import {base, group, pprint} from './common';
import createColumn from '../../src/utils/create-column';

tape('SqlQuery: derive', t => {
  const derive1 = base.derive({f: d => d.a, g: d => d.a + d.b});
  t.deepEqual(
    derive1._clauses.select.slice(0, base.columnNames().length),
    base.columnNames().map(c => createColumn(c)),
    'derive selects original columns',
  );
  // TODO: do real testing
  pprint(derive1);

  const derive2 = base.derive({f: d => d.a + 1, a: d => d.b + 2});
  // TODO: do real testing
  pprint(derive2);

  const derive3 = group.derive({f: d => d.a, g: d => d.a + d.b});
  // TODO: do real testing
  pprint(derive3);

  // TODO: test reserved column name

  t.end();
});
