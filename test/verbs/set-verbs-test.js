import tape from 'tape';
import {SqlQuery} from '../../src';
import createColumn from '../../src/utils/create-column';
import {base, base2, group} from './common';

['concat', 'except', 'intersect', 'union'].forEach(verb => {
  tape('SqlQuery: ' + verb, t => {
    const sv1 = base[verb](group);
    t.equal(sv1._source, base, 'store inner table');
    t.equal(sv1._clauses[verb].length, 1, `${verb} correctly`);
    t.equal(sv1._clauses[verb][0], group, `${verb} correctly`);
    t.deepEqual(sv1._columns, base._columns, 'correct schema');
    t.deepEqual(
      sv1._clauses.select,
      base.columnNames().map(c => createColumn(c)),
      "select first table's columns",
    );

    const sv2 = base[verb](base2, group);
    t.equal(2, sv2._clauses[verb].length, `${verb} correctly`);
    t.deepEqual(base2, sv2._clauses[verb][0], `${verb} correctly`);
    t.deepEqual(group, sv2._clauses[verb][1], `${verb} correctly`);

    const sv3 = base[verb]('table2', 'table3');
    t.equal(2, sv3._clauses[verb].length, `${verb} correctly`);
    t.deepEqual(new SqlQuery('table2'), sv3._clauses[verb][0], `${verb} correctly`);
    t.deepEqual(new SqlQuery('table3'), sv3._clauses[verb][1], `${verb} correctly`);

    t.end();
  });
});
