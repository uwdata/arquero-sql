import aqVerbs from 'arquero/src/verbs';
import {QueryBuilder} from '../query-builder';

export class ArqueroQueryBuilder extends QueryBuilder {
  /**
   * @param {import('arquero').internal.Table} table
   * @param {import('./aq-database').ArqueroDatabase} database
   */
  constructor(table, database) {
    super();

    /** @type {import('arquero').internal.Table} */
    this.table = table;

    /** @type {import('./aq-database').ArqueroDatabase} */
    this._database = database;
  }

  /**
   * @param {import('arquero/src/table/table').ObjectsOptions} [options]
   */
  async objects(options = {}) {
    return this.table.objects(options);
  }
}

Object.keys(aqVerbs).forEach(
  verb =>
    (ArqueroQueryBuilder.prototype[verb] = (qb, ...params) =>
      new ArqueroQueryBuilder(qb.table[verb](qb, ...params), qb._database)),
);
