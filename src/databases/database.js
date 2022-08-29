export class Database {
  constructor() {
    /** @type {['query' | 'update', string, string[]][]} */
    this.history = [];

    /** @type {boolean} */
    this.closed = false;
  }

  /**
   * Execute Query to Database
   * @param {string} text A query string to be executed
   * @param {string[]?} values
   * @returns {Promise<{schema: string[], output: any[][]}>} execution results
   */
  async executeQuery(text, values) {
    if (this.close) {
      throw new Error('Database connection closed');
    }
    this.history.append(['query', text, values]);
    return [];
  }

  /**
   * Execute Update to Database
   * @param {string} text An update string to be executed
   * @param {string[]?} values
   */
  async executeUpdate(text, values) {
    if (this.close) {
      throw new Error('Database connection closed');
    }
    this.history.append(['update', text, values]);
  }

  async close() {
    this.closed = true;
  }
}