import {internal} from 'arquero';

export class TableView extends internal.Transformable {
  /**
   * @typedef {object} ObjectsOptions
   * @property {number} [limit=Infinity]
   * @property {number} [offset=0]
   * @property {import('../table/transformable').Select} [columns]
   * @property {'map'|'entries'|'object'|boolean} [grouped=false]
   */

  /**
   * @param {ObjectsOptions} [options]
   * @returns {object[]}
   */
  // eslint-disable-next-line no-unused-vars
  async objects(options) {
    throw new Error('objects not supported');
  }
}
