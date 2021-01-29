// TODO: export Transformable from arquero
import Transformable from '../node_modules/arquero/src/table/transformable';
import {optimize} from './optimizer';
import {toSql} from './to-sql';
import composeQueries from './utils/compose-queries';
import isFunction from './utils/is-function';
import * as verbs from './verbs/index';

/**
 *
 * @param {any} table
 * @returns {SqlQuery}
 */
export function sqlQuery(table) {
  if (table instanceof SqlQuery) {
    return table;
  } else if (typeof table === 'string') {
    return new SqlQuery(table);
  } else {
    throw new Error('Table must be a string or SqlQuery');
  }
}

export class SqlQuery extends Transformable {
  /**
   * @param {Source} source source table or another sql query
   * @param {Clauses} [clauses] object of sql clauses
   * @param {Schema} [schema] object of table schema
   */
  constructor(source, clauses, schema) {
    super({});
    /** @type {Source} */
    this._source = source;

    /** @type {Clauses} */
    this._clauses = clauses || {};

    /** @type {Schema} */
    this._schema = schema;
  }

  /**
   * @param {Clauses | (c: Clauses, s: Schema) => Clauses} clauses
   * @param {Schema | (c: Clauses, s: Schema) => Schema} [schema]
   */
  _append(clauses, schema) {
    return new SqlQuery(
      this._source,
      isFunction(clauses) ? clauses(this._clauses, this._schema) : clauses,
      schema ? (isFunction(schema) ? schema(this._schema, this._clauses) : schema) : this._schema,
    );
  }

  /**
   * @param {Clauses | (c: Clauses, s: Schema) => Clauses} clauses
   * @param {Schema | (c: Clauses, s: Schema) => Schema} [schema]
   */
  _wrap(clauses, schema) {
    return new SqlQuery(
      this,
      isFunction(clauses) ? clauses(this._clauses, this._schema) : clauses,
      schema ? (isFunction(schema) ? schema(this._schema, this._clauses) : schema) : this._schema,
    );
  }

  /**
   * Indicates if the table has a groupby specification.
   * @return {boolean} True if grouped, false otherwise.
   */
  isGrouped() {
    return !!this._schema.groupby;
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

for (const name in verbs) {
  const verb = verbs[name];
  SqlQuery.prototype['__' + name] = verb
    ? (qb, ...args) => verb(qb, ...args)
    : function () {
        throw new Error('TODO: implement ' + name);
      };
}

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
