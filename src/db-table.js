import * as aq from 'arquero';
import aqVerbs from 'arquero/src/verbs';

export class DBTable extends aq.internal.Transformable {
  /**
   * @param {Promise<import('./databases/table-view').TableView>} tableView
   */
  constructor(tableView) {
    super({});

    /** @type {Promise<import('./databases/table-view').TableView>} */
    this._tableView = tableView;
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
    return await this._tableView.then(b => b.objects(options));
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

Object.keys(verbs).forEach(verb => (DBTable.prototype[verb] = verbFactory(verb)));

['concat', 'intersect', 'except', 'union']
  .map(verb => '__' + verb)
  .forEach(verb => (DBTable.prototype[verb] = verbWithOthersFactory(verb)));

/**
 * @param {string} verb
 */
function verbFactory(verb) {
  /**
   * @param {DBTable} table
   * @param  {...any} params
   */
  function fn(table, ...params) {
    const pparams = params.map(param => {
      if (param instanceof DBTable) {
        return param._tableView;
      } else {
        return Promise.resolve(param);
      }
    });
    const pbuilder = Promise.all([table._tableView, ...pparams]).then(([builder, ...resolves]) =>
      builder[verb](builder, ...resolves),
    );
    return new DBTable(pbuilder);
  }

  return fn;
}

/**
 * @param {string} verb
 */
function verbWithOthersFactory(verb) {
  /**
   * @param {DBTable} table
   * @param  {...any} params
   */
  function fn(table, others, ...params) {
    const pbuilder = Promise.all([table, ...others].map(o => o._builder)).then(([builder, ...otherBuilders]) =>
      builder[verb](builder, otherBuilders, ...params),
    );
    return new DBTable(pbuilder);
  }

  return fn;
}
