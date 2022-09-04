import {all} from 'arquero';
import {TableView} from '../table-view';
import isFunction from 'arquero/src/util/is-function';
import verbs from './verbs';
import postgresCodeGen from './pg-code-gen';

export class PostgresTableView extends TableView {
  /**
   * @param {Source} source source table or another sql query
   * @param {string[]} schema object of table schema
   * @param {Clauses} [clauses] object of sql clauses
   * @param {string[]} [group]
   * @param {OrderInfo} [order]
   * @param {import('./pg-database').PostgresDatabase} [database]
   */
  constructor(source, schema, clauses, group, order, database) {
    super();

    /** @type {Source} */
    this._source = source;

    /** @type {string[]} */
    this._columns = schema;

    if (typeof source !== 'string') {
      database = source._database;
    }
    /** @type {import('./pg-database').PostgresDatabase} */
    this._database = database;

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
   * @prop {Clauses | (c: Clauses) => Clauses} clauses
   * @prop {string[] | (s: string[]) => string[]} group
   * @prop {OrderInfo[] | (o: OrderInfo[]) => OrderInfo[]} order
   */

  /**
   *
   * @param {WrapParams} param0
   */
  _append({columns, clauses, group, order}) {
    return new PostgresTableView(
      this._source,
      columns !== undefined ? (isFunction(columns) ? columns(this._columns) : columns) : this._columns,
      clauses !== undefined ? (isFunction(clauses) ? clauses(this._clauses) : clauses) : this._clauses,
      group != undefined ? (isFunction(group) ? group(this._group) : group) : this._group,
      order != undefined ? (isFunction(order) ? order(this._order) : order) : this._order,
    );
  }

  /**
   *
   * @param {WrapParams} param0
   */
  _wrap({columns, clauses, group, order}) {
    return new PostgresTableView(
      this,
      columns !== undefined ? (isFunction(columns) ? columns(this._columns) : columns) : this._columns,
      clauses !== undefined ? (isFunction(clauses) ? clauses(this._clauses) : clauses) : {},
      group !== undefined ? (isFunction(group) ? group(this._group) : group) : this._group,
      order !== undefined ? (isFunction(order) ? order(this._order) : order) : this._order,
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

  // eslint-disable-next-line no-unused-vars
  column(name) {
    return [];
  }

  _sql() {
    return postgresCodeGen(
      this.ungroup()
        .select(all())
        ._append({clauses: c => ({...c, orderby: this._order}), order: null}),
    );
  }

  /**
   * @param {import('arquero/src/table/table').ObjectsOptions} [options]
   */
  async objects(options = {}) {
    const {grouped, limit, offset} = options;

    if (grouped) {
      throw new Error('TODO: support output grouped table');
    }

    let t = this;
    if (limit !== undefined) {
      t = t._append({clauses: c => ({...c, limit: options.limit})});
    }
    if (offset !== undefined) {
      t = t._append({clauses: c => ({...c, offset: offset})});
    }

    const results = await t._database.query(t._sql());
    return results.rows;
  }
}

Object.assign(PostgresTableView.prototype, verbs);

/** @typedef {string | PostgresTableView} Source _source in PostgresTableView */

/**
 * @typedef {object} AstNode
 * @prop {string} type
 */

/**
 * @typedef {'INNER' | 'LEFT' | 'RIGHT' | "FULL"} JoinType
 */

/**
 * @typedef {object} JoinInfo
 * @prop {AstNode} on
 * @prop {PostgresTableView} other
 * @prop {JoinType} join_type
 */

/**
 * @typedef {object} OrderInfo
 * @prop {AstNode[]} exprs
 * @prop {boolean[]} descs
 */

/**
 * @typedef {object} Clauses _clauses in PostgresTableView
 * @prop {AstNode[]} [select]
 * @prop {AstNode[]} [where]
 * @prop {AstNode[] | boolean} [groupby]
 * @prop {AstNode[]} [having]
 * @prop {JoinInfo} [join]
 * @prop {OrderInfo} [orderby]
 * @prop {number} [limit]
 * @prop {number} [offset]
 * @prop {Source[]} [concat]
 * @prop {Source[]} [union]
 * @prop {Source[]} [intersect]
 * @prop {Source[]} [except]
 */

/**
 * @typedef {object} Schema _schema in PostgresTableView
 * @prop {string[]} columns
 * @prop {string[]} [groupby]
 */
