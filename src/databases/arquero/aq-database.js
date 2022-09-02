import * as aq from 'arquero';
import {v4 as uuid} from 'uuid';
import * as fs from 'fs';
import {DBTable} from '../../db-table';
import {Database} from '../database';
import {ArqueroQueryBuilder} from './aq-query-builder';

export class ArqueroDatabase extends Database {
  constructor() {
    super();

    /** @type {Map<string, aq.internal.Table>} */
    this.tables = new Map();
  }

  /**
   * @param {string} name
   */
  table(name) {
    const pbuilder = Promise.resolve(new ArqueroQueryBuilder(this.tables.get(name), this));
    return new DBTable(pbuilder);
  }

  /**
   * @param {string} path
   * @param {{name: string, type: PGType}[]} schema
   * @param {string?} name
   */
  fromCSV(path, schema, name) {
    name = name || `__aq__table__${uuid().split('-').join('')}__`;
    const result = Promise.resolve().then(() => {
      const table = aq.fromCSV(fs.readFileSync(path));
      this.tables.set(name, table);
      return table;
    });

    return new DBTable(result.then(table => new ArqueroQueryBuilder(table, this)));
  }

  /**
   * @param {import('arquero').internal.Table} table
   * @param {string?} name
   * @returns {DBTable}
   */
  fromArquero(table, name) {
    this.tables.set(name, table);
    return new DBTable(Promise.resolve(new ArqueroQueryBuilder(table, this)));
  }

  async close() {}
}
