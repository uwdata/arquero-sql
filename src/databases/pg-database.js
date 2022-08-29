import {Pool} from 'pg';
import {Database} from './database';

export class PostgresDatabase extends Database {
  /**
   * @param {string} user username
   * @param {string} host host name
   * @param {string} database database name
   * @param {string} password password
   * @param {number} port port
   */
  constructor(user, host, database, password, port) {
    super();
    this.pool = new Pool({user, host, database, password, port});
  }

  /**
   * @param {string} text
   * @param {string[]?} values
   * @returns {Promise<{schema: string[], output: any[][]}>}
   */
  async executeQuery(text, values) {
    values = values ?? [];
    await super.executeQuery(text, values);
    return await this.pool.query(text, values);
  }

  /**
   * @param {string} text
   * @param {string[]?} values
   */
  async executeUpdate(text, values) {
    values = values ?? [];
    await super.executeUpdate(text, values);
    await this.pool.query(text, values);
  }

  async close() {
    await super.close();
    await this.pool.end();
  }
}