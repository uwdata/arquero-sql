import tape from '../tape-wrapper';
import createColumn from '../../src/databases/postgres/utils/create-column';
import {base, base2, group} from './common';

['concat', 'except', 'intersect', 'union'].forEach(verb => {
  tape('verb: ' + verb, t => {
    const sv1 = base[verb](group);
    t.equal(sv1._source, base, 'store inner table');
    t.equal(sv1._clauses[verb].length, 1, `${verb} correctly`);
    t.deepEqual(sv1._clauses[verb][0], group.ungroup(), `${verb} correctly`);
    t.deepEqual(sv1._columns, base._columns, 'correct schema');
    t.deepEqual(
      sv1._clauses.select,
      base.columnNames().map(c => createColumn(c)),
      "select first table's columns",
    );

    const sv2 = base[verb](base2, group);
    t.equal(2, sv2._clauses[verb].length, `${verb} correctly`);
    t.deepEqual(sv2._clauses[verb][0], base2, `${verb} correctly`);
    t.deepEqual(sv2._clauses[verb][1], group.ungroup(), `${verb} correctly`);

    t.end();
  });
});
