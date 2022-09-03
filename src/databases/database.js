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
   * @param {string} path
   * @param {{name: string, type: string}[]} schema
   * @param {string} [name]
   * @returns {DBTable}
   */
  // eslint-disable-next-line no-unused-vars
  fromCSV(path, schema, name) {
    throw new Error('Not implemented');
  }

  /**
   * @param {import('arquero').internal.Table} table
   * @param {string} [name]
   * @returns {DBTable}
   */
  // eslint-disable-next-line no-unused-vars
  fromArquero(table, name) {
    throw new Error('Not implemented');
  }

  async close() {
    throw new Error('Not implemented');
  }
}
