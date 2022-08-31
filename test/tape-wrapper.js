import tape from 'tape';
import {db} from '../src/index';

const database = process.env.PGDB;
const user = process.env.PGUSER;
const password = process.env.PGPASSWORD;
const host = process.env.PGHOST;
const port = process.env.PGPORT;

let setupPromise = new Promise(resolve => {
  tape('setup', t => {
    const pg = new db.Postgres({user, host, database, password, port});
    (async () => {
      await pg.query('DROP TABLE IF EXISTS a1');
      await pg.query('CREATE TABLE a1 (Seattle INT, Chicago INT, NewYork INT)');
      await pg.query(`
          INSERT INTO a1 (Seattle, Chicago, NewYork)
          VALUES
            (69, 135, 165),
            (108, 136, 182),
            (178, 187, 251),
            (207, 215, 281),
            (253, 281, 314),
            (268, 311, 330),
            (312, 318, 300),
            (281, 283, 272),
            (221, 226, 267),
            (142,193,243),
            (72, 113, 189),
            (52, 106, 156)
        `);
      t.end();
      resolve();
    })();
  });
});

/**
 * @param {string} name
 * @param {tape.TestCase} cb
 */
export default function (name, cb) {
  setupPromise = setupPromise.then(() => tape(name, cb));
}
