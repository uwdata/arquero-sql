import {v4 as uuid} from 'uuid';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';
import {DBTable} from '../../db-table';
import {Database} from '../database';
import {DuckDBTableView} from './duckdb-table-view';
import {Database as DuckDB} from 'duckdb';


const defaultDB = new DuckDB(':memory:');

/** @typedef {'TEXT' | 'BOOLEAN' | 'JSON' | 'TIMESTAMPZ' | 'DOUBLE'} DuckDBType */

/**
 * @param {any} value
 * @returns {DuckDBType | null}
 */
function getPGType(value) {
  if (value === null || value === undefined) {
    return null;
  } else if (typeof value === 'string') {
    return 'TEXT';
  } else if (typeof value === 'number') {
    return 'DOUBLE';
  } else if (typeof value === 'boolean') {
    return 'BOOLEAN';
  } else if (value instanceof Date) {
    return 'TIMESTAMPZ';
  } else {
    return 'JSON';
  }
}

/**
 * @param {string} name
 * @param {string[]} cols
 * @returns {string}
 */
function insertInto(name, cols) {
  const vals = cols.map(() => '?');
  return `INSERT INTO ${name} (${cols.join(',')}) VALUES (${vals.join(',')})`;
}

export class DuckDBDatabase extends Database {
  /**
   * @param {DuckDB} [db]
   */
  constructor(db) {
    super();

    /** @type {Connection} */
    this._connection = (db || defaultDB).connect();
  }

  /**
   * @param {string} name
   * @returns {DBTable}
   */
  table(name) {
    const pbuilder = this.getColumnNames(name).then(
      colNames => new DuckDBTableView(name, colNames, null, null, null, this),
    );
    return new DBTable(pbuilder);
  }

  /**
   * @param {string} path
   * @param {{name: string, type: DuckDBType}[]} schema
   * @param {string} [name]
   * @returns {DBTable}
   */
  fromCSV(path, schema, name) {
    name = name || `__aq__table__${uuid().split('-').join('')}__`;
    const columnNames = schema.map(({name}) => name);
    const results = Promise.resolve()
      .then(() => {
        const stream = fs.createReadStream(path);
        const csvData = [];
        const csvStream = fastcsv
          .parse()
          .on('data', csvData.push)
          .on('end', () => csvData.shift());
        stream.pipe(csvStream);
        return csvData;
      })
      .then(async csvData => {
        await this.query(`CREATE TABLE ${name} (${schema.map(({name, type}) => name + ' ' + type).join(',')})`);

        const query = insertInto(name, columnNames);
        for (const row in csvData) {
          await this.query(query, row);
        }
      });

    return getTableAfter(this, results, name);
  }

  /**
   * @param {import('arquero').internal.Table} table
   * @param {string} [name]
   * @returns {DBTable}
   */
  fromArquero(table, name) {
    name = name || `__aq__table__${uuid().split('-').join('')}__`;
    const columnNames = table.columnNames();
    const numRows = table.numRows();
    const results = Promise.resolve()
      .then(() =>
        columnNames.map(cn => {
          const column = table.getter(cn);
          for (let j = 0; j < numRows; j++) {
            const val = column(j);
            const type = getPGType(val);
            if (type !== null) {
              return type;
            }
          }
          return 'TEXT';
        }),
      )
      .then(async types => {
        await this.query(`CREATE TABLE ${name} (${columnNames.map((cn, i) => cn + ' ' + types[i]).join(',')})`);

        // TODO: use prepare -> run
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
              throw new Error('types in column ' + cn + ' do not match');
            }
          }
          await this.query(insert, values);
        }
      });

    return getTableAfter(this, results, name);
  }

  /**
   * @param {string} table
   * @returns {Promise<string[]>}
   */
  async getColumnNames(table) {
    return this._pool
      .query(`PRAGMA table_info('${table}')`)
      .then(result => result.map(r => r.column_name));
  }

  /**
   * @param {string} text
   * @param {string[]} [values]
   * @returns {Promise<object[]>}
   */
  async query(text, values) {
    values = values || [];
    return new Promise((resolve, reject) => {
      this._connection.all(text, ...values, function(err, res) {
        if (err) {
          reject(err);
          throw err;
        }

        resolve(res);
      });
    });
  }

  async close() {
    await this._connection.close();
  }
}

/**
 * @param {Database} db
 * @param {Promise<any>} promise
 * @param {string} name
 */
function getTableAfter(db, promise, name) {
  const pbuilder = promise
    .then(() => db.getColumnNames(name))
    .then(colNames => new DuckDBTableView(name, colNames, null, null, null, db));
  return new DBTable(pbuilder);
}
