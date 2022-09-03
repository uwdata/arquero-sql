import * as aq from 'arquero';
import {v4 as uuid} from 'uuid';
import * as fs from 'fs';
import {AsyncDBTable} from '../../async-db-table';
import {Database} from '../database';
import {ArqueroDBTable} from './aq-db-table';

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
    const pbuilder = Promise.resolve(new ArqueroDBTable(this.tables.get(name), this));
    return new AsyncDBTable(pbuilder);
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

    return new AsyncDBTable(result.then(table => new ArqueroDBTable(table, this)));
  }

  /**
   * @param {import('arquero').internal.Table} table
   * @param {string?} name
   * @returns {AsyncDBTable}
   */
  fromArquero(table, name) {
    this.tables.set(name, table);
    return new AsyncDBTable(Promise.resolve(new ArqueroDBTable(table, this)));
  }

  async close() {}
}
