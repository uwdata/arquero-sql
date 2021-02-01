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
    return filter ? this._schema.columns.filter(filter) : this._schema.columns.slice();
  }

  /**
   * The column name at the given index.
   * @param {number} index The column index.
   * @return {string} The column name,
   *  or undefined if the index is out of range.
   */
  columnName(index) {
    return this._schema.columns[index];
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

    return codeGen(this.ungroup());
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
  * @typedef {object} OrderbyInfo
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
 * @prop {OrderbyInfo} [orderby]
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
