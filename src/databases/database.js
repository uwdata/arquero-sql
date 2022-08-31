import {DBTable} from '../db-table';

export class Database {
  constructor() {
    if (!Database.databases) {
      Database.databases = [];
    }
    Database.databases.push(this);
  }

  /**
   * @param {string} name
   * @param  {Promise<any>[]} promises
   * @returns {DBTable}
   */
  // eslint-disable-next-line no-unused-vars
  table(name, promises) {
    return new DBTable(new Promise(resolve => resolve(null)));
  }

  /**
   * @param {string} table
   * @returns {Promise<string[] | null>}
   */
  // eslint-disable-next-line no-unused-vars
  async getColumnNames(table) {
    return [];
  }

  /**
   * Execute Query to Database
   * @param {string} text A query string to be executed
   * @param {string[]?} values
   * @returns {Promise<import('pg').QueryResult | null>} execution results
   */
  // eslint-disable-next-line no-unused-vars
  async query(text, values) {
    return [];
  }

  /**
   * Execute Update to Database
   * @param {string} text An update string to be executed
   * @param {string[]?} values
   */
  // eslint-disable-next-line no-unused-vars
  async update(text, values) {}

  async close() {}
}
