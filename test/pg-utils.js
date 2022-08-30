/** @typedef {import('arquero').internal.ColumnTable} ColumnTable */
import Client from 'pg-native';
import {SqlQuery} from '../src/sql-query';


const DATABASE = process.env.PGDB;
const USER = process.env.PGUSER;
const PASS = process.env.PGPASSWORD;
const HOST = process.env.PGHOST;
const PORT = process.env.PGPORT;
export function connectClient() {
  const client = new Client();
  client.connectSync(`postgresql://${USER}:${PASS}@${HOST}:${PORT}/${DATABASE}`);
  return client;
}

const TABLE_NAME = name => `___arquero_sql_table_${name}___`;
/**
 *
 * @param {ColumnTable} table
 * @param {string} name
 * @returns {SqlQuery}
 */
export function setupTable(table, name) {
  const columns = table.columnNames();
  const sqlTable = new SqlQuery(TABLE_NAME(name), columns);

  const client = connectClient();
  client.querySync(`DROP TABLE IF EXISTS ${TABLE_NAME(name)}`);
  client.querySync(`CREATE TABLE ${TABLE_NAME(name)} (${columns.map(c => c + ' integer').join(',')})`);

  for (let i = 0; i < table.numRows(); i++) {
    const row = columns.map(c => table.data()[c].data[i]).join(', ');
    client.querySync(`INSERT INTO ${TABLE_NAME(name)} VALUES (${row})`);
  }
  client.end();

  return sqlTable;
}
