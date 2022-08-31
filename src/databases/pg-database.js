import {Pool} from 'pg';
import {Database} from './database';
import {v4 as uuid} from 'uuid';
import * as fs from 'fs';
import * as fastcsv from 'fast-csv';


/** @typedef {'TEXT' | 'BOOLEAN' | 'JSONB' | 'TIMESTAMPZ' | 'NUMERIC'} PGType */


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
    return 'NUMERIC';
  } else if (typeof value === 'boolean') {
    return 'BOOLEAN';
  } else if (value instanceof Date) {
    return 'TIMESTAMPZ';
  } else {
    return 'JSONB';
  }
}

/**
 * @param {number} n
 * @returns {string}
 */
function insertN(n) {
  const array = new Array(n);
  const len = array.length;
  const cols = array.map((_, i) => '$' + (i + 2));
  const vals = array.map((_, i) => '$' + (i + 2 + len));
  return `INSERT INTO $1 (${cols.join(',')}) VALUES (${vals.join(',')})`;
}


export class PostgresDatabase extends Database {
  /**
   * @param {string} user username
   * @param {string} host host name
   * @param {string} database database name
   * @param {string} password password
   * @param {number} port port
   */
  constructor(user, host, database, password, port) {
    super();
    this._pool = new Pool({user, host, database, password, port});
  }

  /**
   * @param {string} path
   * @param {{name: string, type: PGType}[]} schema
   * @param {string?} name
   * @returns {Promise<import('../sql-query').SqlQuery | null>}
   */
  async fromCSV(path, schema, name) {
    name = name || `__aq__table__${uuid()}__`;
    const columnNames = schema.map(({name}) => name);

    const createResult = await this
      .executeUpdate(
        `CREATE TABLE $1 (${schema.map(({type}, i) => '$' + (i + 2) + ' ' + type).join(',')})`,
        [name, ...columnNames]
      )
      // eslint-disable-next-line no-console
      .catch(e => (console.error(e), null));
    if (createResult === null) {
      return null;
    }

    const stream = fs.createReadStream(path);
    const csvData = [];
    const csvStream = fastcsv
      .parse()
      .on('data', csvData.push)
      .on('end', () => csvData.shift());
    stream.pipe(csvStream);

    const query = insertN(columnNames.length);
    const blocking = csvData.map(row => this.executeUpdate(query, [name, ...columnNames, ...row]));
    const results = await Promise.all(blocking)
      // eslint-disable-next-line no-console
      .catch(e => (console.error(e), null));
    if (results === null) {
      return null;
    }

    return this.table(name);
  }

  /**
   * @param {import('arquero').internal.Table} table
   * @param {string?} name
   * @returns {Promise<import('../sql-query').SqlQuery | null>}
   */
  async fromArquero(table, name) {
    name = name || `__aq__table__${uuid()}__`;
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
    const createResult = await this
      .executeUpdate(
        `CREATE TABLE $1 (${types.map((t, i) => '$' + (i + 2) + ' ' + t).join(',')})`,
        [name, ...columnNames]
      )
      // eslint-disable-next-line no-console
      .catch(e => (console.error(e), null));
    if (createResult === null) {
      return null;
    }

    /** @type {string[]} */
    const values = [name, ...columnNames];
    /** @type {Promise<void>[]} */
    const blocking = [];
    const insert = insertN(columnNames.length);
    for (const row of table) {
      /** @type {string[]} */
      const v = [];
      for (const i in columnNames) {
        const cn = columnNames[i];
        const value = row[cn];
        v.push(value);

        const type = getPGType(value);
        if (types[i] !== type && type !== null) {
          // eslint-disable-next-line no-console
          console.error('types in column ' + cn + ' do not match');
          return null;
        }
      }
      blocking.push(this.executeUpdate(insert, [...values, ...v]));
    }
    const results = await Promise
      .all(blocking)
      // eslint-disable-next-line no-console
      .catch(e => (console.error(e), null));
    if (results === null) {
      return null;
    }

    return this.table(name);
  }

  /**
   * @param {string} table
   * @returns {Promise<string[] | null>}
   */
  async getColumnNames(table) {
    return await this
      ._pool
      .query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', [table])
      .then(result => result.rows.map(r => r.column_name))
      // eslint-disable-next-line no-console
      .catch(e => (console.error(e), null));
  }

  /**
   * @param {string} text
   * @param {string[]?} values
   * @returns {Promise<any[] | null>}
   */
  async executeQuery(text, values) {
    values = values || [];
    return await this
      ._pool
      .query(text, values)
      .then(result => result.rows)
      // eslint-disable-next-line no-console
      .catch(e => (console.error(e), null));
    }

  /**
   * @param {string} text
   * @param {string[]?} values
   */
  async executeUpdate(text, values) {
    values = values || [];
    await this._pool.query(text, values);
  }

  async close() {
    await this._pool.end();
  }
}