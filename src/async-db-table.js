import * as aq from 'arquero';
import aqVerbs from 'arquero/src/verbs';

export class AsyncDBTable extends aq.internal.Transformable {
  /**
   * @param {Promise<import('./databases/db-table').DBTable>} table
   */
  constructor(table) {
    super({});

    /** @type {Promise<import('./databases/db-table').DBTable>} */
    this._table = table;
  }

  /**
   * @returns {Promise<aq.internal.ColumnTable>}
   */
  async toArquero() {
    const results = await this.objects();
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
    const table = await this.toArquero();
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
    return await this._table.then(b => b.objects(options));
  }

  /**
   * @param {number} row
   */
  async object(row = 0) {
    const o = await this.objects({limit: 1, offset: row});
    return o && o[0];
  }
}

// eslint-disable-next-line no-unused-vars
const {__except, __concat, __intersect, __union, ...verbs} = aqVerbs;

Object.keys(verbs).forEach(verb => (AsyncDBTable.prototype[verb] = callFactory(verb)));

['concat', 'intersect', 'except', 'union']
  .map(verb => '__' + verb)
  .forEach(verb => (AsyncDBTable.prototype[verb] = callWithOthersFactory(verb)));

/**
 * @param {string} verb
 */
function callFactory(verb) {
  /**
   * @param {AsyncDBTable} table
   * @param  {...any} params
   */
  function fn(table, ...params) {
    const pparams = params.map(param => {
      if (param instanceof AsyncDBTable) {
        return param._table;
      } else {
        return Promise.resolve(param);
      }
    });
    const pbuilder = Promise.all([table._table, ...pparams]).then(([builder, ...resolves]) =>
      builder[verb](builder, ...resolves),
    );
    return new AsyncDBTable(pbuilder);
  }

  return fn;
}

/**
 * @param {string} verb
 */
function callWithOthersFactory(verb) {
  /**
   * @param {AsyncDBTable} table
   * @param  {...any} params
   */
  function fn(table, others, ...params) {
    const pbuilder = Promise.all([table, ...others].map(o => o._builder)).then(([builder, ...otherBuilders]) =>
      builder[verb](builder, otherBuilders, ...params),
    );
    return new AsyncDBTable(pbuilder);
  }

  return fn;
}
