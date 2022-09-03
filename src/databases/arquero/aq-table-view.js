import aqVerbs from 'arquero/src/verbs';
import {TableView} from '../table-view';

export class ArqueroTableView extends TableView {
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
  verb => (ArqueroTableView.prototype[verb] = (qb, ...params) => new ArqueroTableView(qb.table[verb](qb, ...params))),
);
