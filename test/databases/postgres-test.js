import * as aq from 'arquero';
import tape from '../tape-wrapper';
import {db} from '../../src/index';

const database = process.env.PGDB;
const user = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const host = process.env.PGHOST;
const port = process.env.PGPORT;

const pg = new db.Postgres({user, host, database, password, port});

tape('input table', t => {
  t.plan(1);
  (async () => {
    const aq1 = aq.table({
      a: [1, 2, 3, 4],
      b: ['1', '2', '3', '4'],
    });

    const db1 = pg.fromArquero(aq1);
    t.deepEqual(await db1.objects(), aq1.objects());
  })();
});
