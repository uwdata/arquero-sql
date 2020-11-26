import {toSql} from "./to-sql";

export class SqlQuery {

  /**
   * 
   * @param {string | SqlQuery} source source table or another sql query
   * @param {object} clauses object of sql verbs
   */
  constructor(source, clauses, schema) {
    this._source = typeof source === 'string' ? {name: source, toSql: () => source} : source;
    /**
     * {
     *   select: Verbs.select,
     *   where: Verbs.filter[],
     *   groupby: Verbs.groupby
     *   having: Verbs.filter[],,
     *   join: Verbs.join,
     *   derive: Verbs.derive,
     *   orderby: Verbs.orderby,
     *   dedupe: Verbs.dedupe,
     *   sample: Verbs.sample, // no implace -> throw error
     *   concat: Verbs.concat,
     *   union: Verbs.union,
     *   intersect: Verbs.intersect,
     *   .... 
     * }
     */
    this._clauses = clauses || {};
    this._schema = schema;
  }

  toSql() {
    let ret = ""
      if (this._clauses.select)ret += 'SELECT ' +
          this._clauses.select.toAST().columns.map(c => toSql(c)).join(", ") + "\n"

      if (this._clauses.join) ret += 'FROM' + '(' + this._source.toSql() + ')' + 'JOIN' +
          toSql(this._clauses.join.toAST()) + 'ON' + toSql(this._clauses.join.on.toAST()) +
          toSql(this._clauses.join.values)

      if (!this._clauses.join) ret += 'FROM' + '(' +
          (typeof this._source === 'string' ? this._source : this._source.toSql()) + ')' + "\n"

      if (this._clauses.where){ret += 'WHERE ' +
          this._clauses.where.map(c => toSql(c.toAST().criteria)).join(" AND ") + "\n"
      }

      if (this._clauses.groupby) ret += 'GROUP BY ' +
          this._clauses.groupby.toAST().keys.map(c => toSql(c)).join(", ") + "\n"

      if (this._clauses.having) ret += 'HAVING' +
          this._clauses.having.map(verb =>
              toSql(verb.toAST().criteria)).join(" AND ") + "\n"

      if (this._clauses.orderby) ret += 'ORDER BY ' +
          (this._clauses.orderby.toAST().keys.map(c => toSql(c)).join(", "))+ "\n"

      // TODO: what to deal with tablerefList type
      if (this._clauses.union) ret += 'UNION ' +
          this._clauses.union.map(c => c.tables).join(" UNION ") + "\n"

      if (this._clauses.intersect) ret += 'INTERSECT' +
          this._clauses.intersect.toAST().tables.map(c => toSql(c)).join(" AND ")
    return ret
  }
}
