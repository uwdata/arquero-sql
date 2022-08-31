import {Pool} from 'pg';
import {v4 as uuid} from 'uuid';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';
import {DBTable} from '../../db-table';
import {Database} from '../database';
import {PostgresQueryBuilder} from './pg-query-builder';

/** @typedef {'TEXT' | 'BOOLEAN' | 'JSONB' | 'TIMESTAMPZ' | 'DOUBLE PRECISION'} PGType */

/**
 * @param {any} value
 * @returns {PGType | null}
 */
function getPGType(value) {
  if (value === null || value === undefined) {
    return null;
  } else if (typeof value === 'string') {
    return 'TEXT';
  } else if (typeof value === 'number') {
    return 'DOUBLE PRECISION';
  } else if (typeof value === 'boolean') {
    return 'BOOLEAN';
  } else if (value instanceof Date) {
    return 'TIMESTAMPZ';
  } else {
    return 'JSONB';
  }
}

/**
 * @param {string} name
 * @param {string[]} cols
 * @returns {string}
 */
function insertInto(name, cols) {
  const vals = cols.map((_, i) => '$' + (i + 1));
  return `INSERT INTO ${name} (${cols.join(',')}) VALUES (${vals.join(',')})`;
}

export class PostgresDatabase extends Database {
  /**
   * @typedef {object} PostgresCredential
   * @prop {string} user username
   * @prop {string} host host name
   * @prop {string} database database name
   * @prop {string} password password
   * @prop {number} port port
   */

  /**
   * @param {PostgresCredential} credential
   */
  constructor({user, host, database, password, port}) {
    super();

    /** @type {Pool} */
    this._pool = new Pool({user, host, database, password, port});
  }

  /**
   * @param {string} name
   * @param  {Promise<any>[]} promises
   * @returns {DBTable}
   */
  table(name, promises) {
    const pbuilder = Promise.all([this.getColumnNames(name), ...promises])
      .then(([colNames, ...results]) => {
        if (results.includes(null)) {
          return null;
        }
        return new PostgresQueryBuilder(name, colNames, null, null, null, this);
      })
      .catch(e => (console.error(e), null));

    return new DBTable(pbuilder);
  }

  /**
   * @param {string} path
   * @param {{name: string, type: PGType}[]} schema
   * @param {string?} name
   * @returns {DBTable}
   */
  fromCSV(path, schema, name) {
    name = name || `__aq__table__${uuid().split('-').join('')}__`;
    const columnNames = schema.map(({name}) => name);

    const stream = fs.createReadStream(path);
    const csvData = [];
    const csvStream = fastcsv
      .parse()
      .on('data', csvData.push)
      .on('end', () => csvData.shift());
    stream.pipe(csvStream);

    const results = this.update(
      `CREATE TABLE ${name} (${schema.map(({name, type}) => name + ' ' + type).join(',')})`,
      columnNames,
    )
      .then(async () => {
        const query = insertInto(name, columnNames);
        await this.update('BEGIN');
        for (const row in csvData) {
          await this.update(query, row);
        }
        return this.update('COMMIT');
      })
      .catch(e => (console.error(e), null));

    return this.table(name, [results]);
  }

  /**
   * @param {import('arquero').internal.Table} table
   * @param {string?} name
   * @returns {DBTable}
   */
  fromArquero(table, name) {
    name = name || `__aq__table__${uuid().split('-').join('')}__`;
    const columnNames = table.columnNames();
    const numRows = table.numRows();

    /** @type {PGType[]} */
    const types = columnNames.map(() => null);
    for (const i in columnNames) {
      const cn = columnNames[i];
      const column = table.getter(cn);
      for (let j = 0; j < numRows; j++) {
        const val = column(j);
        const type = getPGType(val);
        if (type !== null) {
          types[i] = type;
          break;
        }
      }
    }
    const results = this.update(`CREATE TABLE ${name} (${columnNames.map((cn, i) => cn + ' ' + types[i]).join(',')})`)
      .then(async () => {
        /** @type {string[]} */
        const insert = insertInto(name, columnNames);
        for (const row of table) {
          /** @type {string[]} */
          const values = [];
          for (const i in columnNames) {
            const cn = columnNames[i];
            const value = row[cn];
            values.push(value);

            const type = getPGType(value);
            if (types[i] !== type && type !== null) {
              console.error('types in column ' + cn + ' do not match');
              return null;
            }
          }
          await this.update(insert, values);
        }

        let fieldLength = 0;
        while (fieldLength !== columnNames.length) {
          const results = await this.query(`SELECT * from ${name} LIMIT 1`);
          if (results === null) {
            throw new Error('Failed to inspect created table');
          }

          fieldLength = results.fields.length;
          await new Promise(r => setTimeout(r, 200));
        }
      })
      .catch(e => (console.error(e), null));

    return this.table(name, [results]);
  }

  /**
   * @param {string} table
   * @returns {Promise<string[] | null>}
   */
  async getColumnNames(table) {
    return await this._pool
      .query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', [table])
      .then(result => result.rows.map(r => r.column_name))
      .catch(e => (console.error(e), null));
  }

  /**
   * @param {string} text
   * @param {string[]?} values
   * @returns {Promise<import('pg').QueryResult | null>}
   */
  async query(text, values) {
    values = values || [];
    return await this._pool
      .query(text, values)
      .then(result => {
        console.log(
          'query',
          result && result.rows,
          result && result.fields,
          result && result.command,
          result && result.rowCount,
        );
        return result;
      })
      .catch(e => (console.error(e), null));
  }

  /**
   * @param {string} text
   * @param {string[]?} values
   */
  async update(text, values) {
    values = values || [];
    const result = await this._pool.query(text, values);
    console.log(
      'update',
      result && result.rows,
      result && result.fields,
      result && result.command,
      result && result.rowCount,
    );
  }

  async close() {
    await this._pool.end();
  }
}
