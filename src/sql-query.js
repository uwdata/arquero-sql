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
     * clauses = {
     *   select: expr[],
     *   where: expr[],
     *   groupby: Verbs.groupby??
     *   having: expr[],
     *   join: {table: ??, on: expr[], option: 'left' | 'right' | 'outer'},
     *   orderby: expr[],
     *   distinct: string[],
     *   limit: number,
     *   concat: string[],
     *   union: string[],
     *   intersect: string[],
     *   except: string[]
     * }
     */
    this._clauses = clauses || {};
    /**
     * schema = {
     *   columns: string[],
     *   groupby?: string[]
     * }
     */
    this._schema = schema;
  }

  toSql() {
    let ret = '';
    if (this._clauses.select)
      ret +=
          'SELECT ' +
          (this._clauses.distinct ? 'DISTINCT' : '') +
          this._clauses.select
              .map(c => toSql(c))
              .join(', ') +
          '\n';

    if (this._clauses.join)
      ret +=
          'FROM' +
          '(' +
          this._source.toSql() +
          ')' +
          'JOIN' +
          toSql(this._clauses.join.toAST()) +
          'ON' +
          toSql(this._clauses.join.on.toAST()) +
          toSql(this._clauses.join.values);

    if (!this._clauses.join)
      ret += 'FROM' + '(' + (typeof this._source === 'string' ? this._source : this._source.toSql()) + ')' + '\n';

    if (this._clauses.where) {
      ret += 'WHERE ' + this._clauses.where.map(c => toSql(c.toAST().criteria)).join(' AND ') + '\n';
    }

    if (this._clauses.groupby)
      ret +=
          'GROUP BY ' +
          this._clauses.groupby
              .toAST()
              .keys.map(c => toSql(c))
              .join(', ') +
          '\n';

    if (this._clauses.having)
      ret += 'HAVING ' + this._clauses.having.map(verb => toSql(verb.toAST().criteria)).join(' AND ') + '\n';

    if (this._clauses.orderby)
      ret +=
          'ORDER BY ' +
          this._clauses.orderby
              .toAST()
              .keys.map(c => toSql(c))
              .join(', ') +
          '\n';

    // TODO: what to deal with tablerefList type
    if (this._clauses.union) ret += 'UNION \nSELECT * FROM\n ' +
        this._clauses.union.
        join("\nUNION \nSELECT * FROM \n") + "\n"

    if (this._clauses.intersect) ret += 'INTERSECT \nSELECT * FROM\n ' +
        this._clauses.intersect.
        join("\nINTERSECT \nSELECT * FROM \n") + "\n"

    if (this._clauses.except) ret += 'EXCEPT \nSELECT * FROM\n ' +
        this._clauses.except.
        join("\nEXCEPT \nSELECT * FROM \n") + "\n"

    if (this._clauses.concat) ret += 'CONCAT \nSELECT * FROM\n ' +
        this._clauses.concat.
        join("\nCONCAT \nSELECT * FROM \n") + "\n"
    return ret
  }
}
