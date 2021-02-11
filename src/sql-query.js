import {internal} from 'arquero';
import isFunction from 'arquero/src/util/is-function';
import codeGen from './code-gen';
import {optimize} from './optimizer';
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

export class SqlQuery extends internal.Transformable {
  /**
   * @param {Source} source source table or another sql query
   * @param {string[]} schema object of table schema
   * @param {Clauses} [clauses] object of sql clauses
   * @param {string[]} [group]
   * @param {OrderInfo} [order]
   */
  constructor(source, schema, clauses, group, order) {
    super({});
    /** @type {Source} */
    this._source = source;

    /** @type {string[]} */
    this._columns = schema;

    /** @type {Clauses} */
    this._clauses = clauses || {};

    /** @type {string[]} */
    this._group = group;

    /** @type {OrderInfo} */
    this._order = order;
  }

  /**
   *
   * @typedef {object} WrapParams
   * @prop {string[] | (s: string[]) => string[]} columns
   * @prop {Clauses | (c: Clauses) => Caluses} clauses
   * @prop {string[] | (s: string[]) => string[]} group
   * @prop {OrderInfo[] | (o: OrderInfo[]) => OrderInfo[]} order
   */

  /**
   *
   * @param {WrapParams} param0
   */
  _append({columns, clauses, group, order}) {
    return new SqlQuery(
      this._source,
      columns ? (isFunction(columns) ? columns(this._columns) : columns) : this._columns,
      clauses ? (isFunction(clauses) ? clauses(this._clauses) : clauses) : this._clauses,
      group ? (isFunction(group) ? group(this._group) : group) : this._group,
      order ? (isFunction(order) ? order(this._order) : order) : this._order,
    );
  }

  /**
   *
   * @param {WrapParams} param0
   */
  _wrap({columns, clauses, group, order}) {
    return new SqlQuery(
      this,
      columns ? (isFunction(columns) ? columns(this._columns) : columns) : this._columns,
      clauses ? (isFunction(clauses) ? clauses(this._clauses) : clauses) : {},
      group ? (isFunction(group) ? group(this._group) : group) : this._group,
      order ? (isFunction(order) ? order(this._order) : order) : this._order,
    );
  }

  /**
   * Indicates if the table has a groupby specification.
   * @return {boolean} True if grouped, false otherwise.
   */
  isGrouped() {
    return !!this._group;
  }

  /**
   * @returns {SqlQuery} optimized query
   */
  optimize() {
    return optimize(this);
  }

  /**
   * Filter function invoked for each column name.
   * @callback NameFilter
   * @param {string} name The column name.
   * @param {number} index The column index.
   * @param {string[]} array The array of names.
   * @return {boolean} Returns true to retain the column name.
   */

  /**
   * The table column names, optionally filtered.
   * @param {NameFilter} [filter] An optional filter function.
   *  If unspecified, all column names are returned.
   * @return {string[]} An array of matching column names.
   */
  columnNames(filter) {
    return filter ? this._columns.filter(filter) : this._columns.slice();
  }

  /**
   * The column name at the given index.
   * @param {number} index The column index.
   * @return {string} The column name,
   *  or undefined if the index is out of range.
   */
  columnName(index) {
    return this._columns[index];
  }

  /**
   * dummy function for parsing
   * @returns {[]}
   */
  column() {
    return [];
  }

  /**
   * @param {{optimize?: boolean}} options option for translating to SQL
   * @returns {string} SQL representation of this SqlQuery
   */
  toSql(options = {}) {
    const {optimize} = options;
    // const table = optimize === false ? this : this.optimize();
    if (optimize) {
      throw new Error('TODO: support optimization');
    }

    return codeGen(this.ungroup()._append({clauses: {orderby: this._order}, order: null}));
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
 * @typedef {object} AstNode
 * @prop {string} type
 */

/**
 * @typedef {'INNER' | 'LEFT' | 'RIGHT' | "OUTER"} JoinType
 */

/**
 * @typedef {object} JoinInfo
 * @prop {AstNode} on
 * @prop {SqlQuery} other
 * @prop {JoinType} join_type
 */

/**
 * @typedef {object} OrderInfo
 * @prop {AstNode[]} exprs
 * @prop {boolean[]} descs
 */

/**
 * @typedef {object} Clauses _clauses in SqlQuery
 * @prop {AstNode[]} [select]
 * @prop {AstNode[]} [where]
 * @prop {AstNode[]} [groupby]
 * @prop {AstNode[]} [having]
 * @prop {JoinInfo} [join]
 * @prop {OrderInfo} [orderby]
 * @prop {number} [limit]
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
