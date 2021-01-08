import {optimize} from './optimizer';
import {toSql} from './to-sql';
import {composeQueries} from './utils';

/** @typedef {string | SqlQuery} Source _source in SqlQuery */

/**
 * @typedef {object} Clauses _clauses in SqlQuery
 * @prop {object[]} [select]
 * @prop {object[]} [where]
 * @prop {string[]} [groupby]
 * @prop {object[]} [having]
 * @prop {Source} [join]
 * @prop {object[]} [orderby]
 * @prop {boolean} [distinct]
 * @prop {Source[]} [concat]
 * @prop {Source[]} [union]
 * @prop {Source[]} [intersect]
 * @prop {Source[]} [except]
 */

/**
 * @typedef {object} Schema _schema in SqlQuery
 * @prop {string[]} columns
 * @prop {string[]} [groupby]
 */

export class SqlQuery {
  /**
   *
   * @param {Source} source source table or another sql query
   * @param {Clauses} [clauses] object of sql clauses
   * @param {Schema} [schema] object of table schema
   */
  constructor(source, clauses, schema) {
    /** @type {Source} */
    this._source = source;

    /** @type {Clauses} */
    this._clauses = clauses || {};

    /** @type {Schema} */
    this._schema = schema;
  }

  /**
   * @returns {SqlQuery} optimized query
   */
  optimize() {
    return optimize(this);
  }

  /**
   * @param {{optimize?: boolean}} options option for translating to SQL
   * @returns {string} SQL representation of this SqlQuery
   */
  toSql(options = {}) {
    const {optimize} = options;
    const table = optimize === false ? this : this.optimize();

    let ret = '';
    if (Object.keys(table._clauses).length === 0) return table._source.toSql();
    const clauses = table._clauses;
    if (clauses.select)
      ret += 'SELECT ' + (clauses.distinct ? 'DISTINCT' : '') + clauses.select.map(c => toSql(c)).join(', ') + '\n';
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

    if (!clauses.join)
      ret += 'FROM' + '(' + (typeof table._source === 'string') ? table._source : table._source.toSql() + ')' + '\n';

    if (clauses.where) {
      ret += 'WHERE ' + clauses.where.map(c => toSql(c)).join(' AND ') + '\n';
    }

    if (clauses.groupby) ret += 'GROUP BY ' + clauses.groupby.join(', ') + '\n';

    if (clauses.having) ret += 'HAVING ' + clauses.having.map(verb => toSql(verb)).join(' AND ') + '\n';

    if (clauses.orderby) ret += 'ORDER BY ' + clauses.orderby.map(key => toSql(key)).join(', ') + '\n';

    // TODO: what to deal with tablerefList type
    if (clauses.union && clauses.union.length > 0) ret += 'UNION\n' + composeQueries('UNION\n', clauses.union);

    if (clauses.intersect && clauses.intersect.length > 0)
      ret += 'INTERSECT\n' + composeQueries('INTERSECT\n', clauses.intersect);

    if (clauses.except && clauses.except.length > 0) ret += 'EXCEPT\n' + composeQueries('EXCEPT\n', clauses.except);

    if (clauses.concat && clauses.concat.length > 0) ret += 'CONCAT\n' + composeQueries('CONCAT\n', clauses.concat);
    return ret;
  }
}
