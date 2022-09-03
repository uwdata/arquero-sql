import aqVerbs from 'arquero/src/verbs';
import {DBTable} from '../db-table';

export class ArqueroDBTable extends DBTable {
  /**
   * @param {import('arquero').internal.Table} table
   */
  constructor(table) {
    super();

    /** @type {import('arquero').internal.Table} */
    this.table = table;
  }

  /**
   * @param {import('arquero/src/table/table').ObjectsOptions} [options]
   */
  async objects(options = {}) {
    return this.table.objects(options);
  }
}

Object.keys(aqVerbs).forEach(
  verb => (ArqueroDBTable.prototype[verb] = (qb, ...params) => new ArqueroDBTable(qb.table[verb](qb, ...params))),
);
