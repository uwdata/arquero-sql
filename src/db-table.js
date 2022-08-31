import {internal} from 'arquero';
import * as aq from 'arquero';

export class DBTable extends internal.Transformable {
  /**
   * @param {Promise<import('./databases/query-builder').QueryBuilder>} builder
   */
  constructor(builder) {
    super({});

    /** @type {Promise<import('./databases/query-builder').QueryBuilder>} */
    this._builder = builder;
  }

  /**
   * @returns {Promise<internal.ColumnTable>}
   */
  async toArquero() {
    const results = await this.objects().catch(e => (console.error(e), null));
    return results && aq.from(results);
  }

  /**
   * @typedef {object} PrintOptions
   * @property {number} [limit=Infinity]
   * @property {number} [offset=0]
   * @property {import('arquero/src/table/transformable').Select} [columns]
   */

  /**
   *
   * @param {PrintOptions | number} options
   */
  async print(options = {}) {
    const table = await this.toArquero().catch(e => (console.error(e), null));
    if (table === null) {
      return null;
    }

    table.print(options);
    return this;
  }

  /**
   * @typedef {object} ObjectsOptions
   * @property {number} [limit=Infinity]
   * @property {number} [offset=0]
   * @property {import('../table/transformable').Select} [columns]
   * @property {'map'|'entries'|'object'|boolean} [grouped=false]
   */

  /**
   * @param {ObjectsOptions} [options]
   */
  async objects(options = {}) {
    return await this._builder.then(b => b.objects(options));
  }

  /**
   * @param {number} row
   */
  async object(row = 0) {
    const o = await this.objects({limit: 1, offset: row});
    return o && o[0];
  }
}

[
  'count',
  'dedupe',
  'derive',
  'filter',
  'groupby',
  'join',
  'orderby',
  'rollup',
  'sample',
  'select',
  'ungroup',
  'unorder',
].forEach(verb => {
  verb = '__' + verb;
  DBTable.prototype[verb] = (db, ...params) => call(verb, db, ...params);
});

['concat', 'intersect', 'except', 'union'].forEach(verb => {
  verb = '__' + verb;
  DBTable.prototype[verb] = (db, ...params) => call_with_others(verb, db, ...params);
});

/**
 * @param {string} verb
 * @param {DBTable} table
 * @param {...any} params
 */
function call(verb, table, ...params) {
  params = params.map(param => {
    if (param instanceof Promise) {
      return param;
    } else {
      return new Promise(r => r(param));
    }
  });
  const pbuilder = Promise.all([table._builder, ...params])
    .then(([builder, ...resolves]) => builder[verb](...resolves))
    .catch(e => (console.error(e), null));
  return new DBTable(pbuilder);
}

/**
 * @param {string} verb
 * @param {DBTable} table
 * @param {DBTable[] | DBTable} others
 * @param {...any} params
 */
function call_with_others(verb, table, others, ...params) {
  const pbuilder = Promise.all([table._builder, ...others.map(o => o._builder)])
    .then(([builder, ...otherBuilders]) => builder[verb](otherBuilders, ...params))
    .catch(e => (console.error(e), null));
  return new DBTable(pbuilder);
}
