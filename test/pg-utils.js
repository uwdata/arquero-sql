/** @typedef {import('arquero').internal.ColumnTable} ColumnTable */
import { PostgresDatabase } from '../src/databases/pg-database';


const DATABASE = process.env.PGDB;
const USER = process.env.PGUSER;
const PASS = process.env.PGPASSWORD;
const HOST = process.env.PGHOST;
const PORT = process.env.PGPORT;

const pg = new PostgresDatabase(USER, HOST, DATABASE, PASS, parseInt(PORT));

/**
 * @param {import('arquero').internal.Table} table
 * @param {string} name 
 */
export async function setupTable2(table, name) {
  return await pg.fromArquero(table, name);
}