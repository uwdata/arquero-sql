import {optimize} from './optimizer';
import {toSql} from './to-sql';
import { composeQueries } from './utils';

/**
 * @typedef {object} Clauses clauses in SqlQuery
 * @property {object[]} [select]
 * @property {object[]} [where]
 * @property {string[]} [groupby]
 * @property {object[]} [having]
 * @property {object[]} [join]
 * @property {object[]} [orderby]
 * @property {boolean} [distinct]
 * @property {string[]} [concat]
 * @property {string[]} [union]
 * @property {string[]} [intersect]
 * @property {string[]} [except]
 */

export class SqlQuery {
  /**
   *
   * @param {string | SqlQuery} source source table or another sql query
   * @param {Clauses} clauses object of sql clauses
   * @param {object} schema object of table schema
   */
  constructor(source, clauses, schema) {
    /** @type {string | SqlQuery} */
    this._source = source;
    /**
     * clauses = {
     *   select: expr[],
     *   where: expr[],
     *   groupby: string[],
     *   having: expr[],
     *   join: {table: ??, on: expr[], option: 'left' | 'right' | 'outer'},
     *   orderby: expr[],
     *   distinct: boolean,
     *   limit: number,
     *   concat: string[],
     *   union: string[],
     *   intersect: string[],
     *   except: string[]
     * }
     */

    /** @type {Clauses} */
    this._clauses = clauses || {};
    /**
     * schema = {
     *   columns: string[],
     *   groupby?: string[]
     * }
     */
    this._schema = schema;
  }

  optimize() {
    return optimize(this);
  }

  toSql(options = {}) {
    const {optimize} = options;
    const table = optimize === false ? this : this.optimize();

    let ret = '';
    if (Object.keys(table._clauses).length === 0) return table._source.toSql();
    const clauses = table._clauses;
    if (clauses.select)
      ret +=
        'SELECT ' +
        (clauses.distinct ? 'DISTINCT' : '') +
        clauses.select.map(c => toSql(c)).join(', ') +
        '\n';
    else ret += 'SELECT * ';

    if (clauses.join)
      ret +=
        'FROM' +
        '(' +
        table._source.toSql() +
        ')' +
        'JOIN' +
        toSql(clauses.join.toAST()) +
        'ON' +
        toSql(clauses.join.on.toAST()) +
        toSql(clauses.join.values);

    if (!clauses.join) ret += 'FROM' + '(' + (typeof table._source === 'string') ? table._source : table._source.toSql() + ')' + '\n';

    if (clauses.where) {
      ret += 'WHERE ' + clauses.where.map(c => toSql(c)).join(' AND ') + '\n';
    }

    if (clauses.groupby) ret += 'GROUP BY ' + clauses.groupby.join(', ') + '\n';

    if (clauses.having) ret += 'HAVING ' + clauses.having.map(verb => toSql(verb)).join(' AND ') + '\n';

    if (clauses.orderby) ret += 'ORDER BY ' + clauses.orderby.map(key => toSql(key)).join(', ') + '\n';

    // TODO: what to deal with tablerefList type
    if (clauses.union && clauses.union.length > 0)
      ret += 'UNION\n' + composeQueries('UNION\n', clauses.union);

    if (clauses.intersect && clauses.intersect.length > 0)
      ret += 'INTERSECT\n' + composeQueries('INTERSECT\n', clauses.intersect);

    if (clauses.except && clauses.except.length > 0)
      ret += 'EXCEPT\n' + composeQueries('EXCEPT\n', clauses.except);

    if (clauses.concat && clauses.concat.length > 0)
      ret += 'CONCAT\n' + composeQueries('CONCAT\n', clauses.concat);
    return ret;
  }
}
