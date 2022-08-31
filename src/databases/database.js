export class Database {
  constructor() {
    if (!Database.databases) {
      Database.databases = [];
    }
    Database.databases.push(this);
  }

  /**
   * @param {string} name
   * @returns {DBTable}
   */
  // eslint-disable-next-line no-unused-vars
  table(name) {
    throw new Error('Not implemented');
  }

  /**
   * @param {string} table
   * @returns {Promise<string[]>}
   */
  // eslint-disable-next-line no-unused-vars
  async getColumnNames(table) {
    throw new Error('Not implemented');
  }

  /**
   * Execute Query to Database
   * @param {string} text A query string to be executed
   * @param {string[]?} values
   * @returns {Promise<import('pg').QueryResult>} execution results
   */
  // eslint-disable-next-line no-unused-vars
  async query(text, values) {
    throw new Error('Not implemented');
  }

  async close() {
    throw new Error('Not implemented');
  }
}
