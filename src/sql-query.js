import {fuse} from './optimizer';
import {toSql} from './to-sql';

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

  optimize() {
    return fuse(this);
  }

  toSql() {
    let ret = '';
    if (Object.keys(this._clauses).length === 0) return this._source.toSql();
    if (!this._clauses.select) ret += 'SELECT * ';
    if (this._clauses.select)
      ret +=
        'SELECT ' +
        (this._clauses.distinct ? 'DISTINCT' : '') +
        this._clauses.select.map(c => toSql(c)).join(', ') +
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

    if (!this._clauses.join) ret += 'FROM' + '(' + this._source.toSql() + ')' + '\n';

    if (this._clauses.where) {
      ret += 'WHERE ' + this._clauses.where.map(c => toSql(c)).join(' AND ') + '\n';
    }

    if (this._clauses.groupby) ret += 'GROUP BY ' + this._clauses.groupby.join(', ') + '\n';

    if (this._clauses.having) ret += 'HAVING ' + this._clauses.having.map(verb => toSql(verb)).join(' AND ') + '\n';

    if (this._clauses.orderby) ret += 'ORDER BY ' + this._clauses.orderby.map(key => toSql(key)).join(', ') + '\n';

    // TODO: what to deal with tablerefList type
    if (this._clauses.union)
      ret += 'UNION \nSELECT * FROM ' + this._clauses.union.join('\nUNION \nSELECT * FROM ') + '\n';

    if (this._clauses.intersect)
      ret += 'INTERSECT \nSELECT * FROM ' + this._clauses.intersect.join('\nINTERSECT \nSELECT * FROM ') + '\n';

    if (this._clauses.except)
      ret += 'EXCEPT \nSELECT * FROM ' + this._clauses.except.join('\nEXCEPT \nSELECT * FROM ') + '\n';

    if (this._clauses.concat)
      ret += 'CONCAT \nSELECT * FROM ' + this._clauses.concat.join('\nCONCAT \nSELECT * FROM ') + '\n';
    return ret;
  }
}
