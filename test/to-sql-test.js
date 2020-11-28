import tape from 'tape';
import {createColumn, resolveColumns} from "../src/utils";
import {toSql} from "../src";
import {SqlQuery} from "../src";
import {internal} from "arquero";
const {Verbs} = internal;

const sqlQuery = new SqlQuery(
    'table',
    {except: (['table1', 'table2']),
        select: [Verbs.select('a').toAST().columns[0],
            Verbs.derive({b: d => d.a + 1}).toAST().values[0]],
        where: [Verbs.filter(d => d.a > 0)],
        having: [Verbs.filter(d => op.mean(d.a))]},
    // Verbs.select(['d => mean(d.foo)'])},
    'foo'
)

tape('to-sql : well printed', t => {
    t.equal(
        sqlQuery.toSql(),
        "SELECT a, (a+1)\n" +
        "FROM(table)\n" +
        "WHERE (a>0)\n" +
        "HAVING AVG(a)\n" +
        "EXCEPT \n" +
        "SELECT * FROM\n" +
        " table1\n" +
        "EXCEPT \n" +
        "SELECT * FROM \n" +
        "table2\n",
        "basic test"
)
    t.equal(

    )
    t.end();
})