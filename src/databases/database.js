import {SqlQuery} from '../sql-query';

export class Database {
  async table(name) {
    const columnNames = await this.getColumnNames(name);
    return new SqlQuery(name, columnNames, null, null, null, this);
  }

  /**
   * @param {string} table
   * @returns {Promise<string[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async getColumnNames(table) {
    return [];
  }

  /**
   * Execute Query to Database
   * @param {string} text A query string to be executed
   * @param {string[]?} values
   * @returns {Promise<{schema: string[], output: any[][]}>} execution results
   */
  // eslint-disable-next-line no-unused-vars
  async executeQuery(text, values) {
    return [];
  }

  /**
   * Execute Update to Database
   * @param {string} text An update string to be executed
   * @param {string[]?} values
   */
  // eslint-disable-next-line no-unused-vars
  async executeUpdate(text, values) {}

  async close() {}
}