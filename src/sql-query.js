import {optimize} from './optimizer';
import {toSql} from './to-sql';

export class SqlQuery {
  /**
   *
   * @param {string | SqlQuery} source source table or another sql query
   * @param {object} clauses object of sql clauses
   * @param {object} schema object of table schema
   */
  constructor(source, clauses, schema) {
    this._source = typeof source === 'string' ? {name: source, toSql: () => source} : source;
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
    if (!table._clauses.select) ret += 'SELECT * ';
    if (table._clauses.select)
      ret +=
        'SELECT ' +
        (table._clauses.distinct ? 'DISTINCT' : '') +
        table._clauses.select.map(c => toSql(c)).join(', ') +
        '\n';

    if (table._clauses.join)
      ret +=
        'FROM' +
        '(' +
        table._source.toSql() +
        ')' +
        'JOIN' +
        toSql(table._clauses.join.toAST()) +
        'ON' +
        toSql(table._clauses.join.on.toAST()) +
        toSql(table._clauses.join.values);

    if (!table._clauses.join) ret += 'FROM' + '(' + table._source.toSql() + ')' + '\n';

    if (table._clauses.where) {
      ret += 'WHERE ' + table._clauses.where.map(c => toSql(c)).join(' AND ') + '\n';
    }

    if (table._clauses.groupby) ret += 'GROUP BY ' + table._clauses.groupby.join(', ') + '\n';

    if (table._clauses.having) ret += 'HAVING ' + table._clauses.having.map(verb => toSql(verb)).join(' AND ') + '\n';

    if (table._clauses.orderby) ret += 'ORDER BY ' + table._clauses.orderby.map(key => toSql(key)).join(', ') + '\n';

    // TODO: what to deal with tablerefList type
    if (table._clauses.union)
      ret += 'UNION \nSELECT * FROM ' + table._clauses.union.join('\nUNION \nSELECT * FROM ') + '\n';

    if (table._clauses.intersect)
      ret += 'INTERSECT \nSELECT * FROM ' + table._clauses.intersect.join('\nINTERSECT \nSELECT * FROM ') + '\n';

    if (table._clauses.except)
      ret += 'EXCEPT \nSELECT * FROM ' + table._clauses.except.join('\nEXCEPT \nSELECT * FROM ') + '\n';

    if (table._clauses.concat)
      ret += 'CONCAT \nSELECT * FROM ' + table._clauses.concat.join('\nCONCAT \nSELECT * FROM ') + '\n';
    return ret;
  }
}
