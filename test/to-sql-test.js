import tape from 'tape';
import {createColumn, resolveColumns} from "../src/utils";
import {toSql} from "../src";
import {SqlQuery} from "../src";
import {internal} from "arquero";
const {Verbs} = internal;

tape('to-sql : well printed', t => {

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
    const sqlQueryNested = new SqlQuery(
        new SqlQuery(
            "table",
            {select: [Verbs.select('a').toAST().columns[0]]},
            'foo'
        ),
        {select: [Verbs.select('b').toAST().columns[0]],
            where: [Verbs.filter(d => d.a > 0)]},
        'bar'
    )

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
        sqlQueryNested.toSql(),
        "SELECT b\n" +
        "FROM(SELECT a\n" +
        "FROM(table)\n" +
        ")\n" +
        "WHERE (a>0)\n",
        "nested sql"
    )
    t.end();
})