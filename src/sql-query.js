export class SqlQuery {

  /**
   * 
   * @param {string | SqlQuery} source source table or another sql query
   * @param {object} clauses object of sql verbs
   */
  constructor(source, clauses, schema) {
    this._source = source;
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

  append(clauses_fn, schema_fn) {
    return new SqlQuery(
      this._source,
      clauses_fn(this._clauses),
      schema_fn(this._schema),
    );
  }

  wrap(clauses_fn, schema_fn) {
    return new SqlQuery(
      this,
      clauses_fn(this._clauses),
      schema_fn(this._schema),
    );
  }

  toSql() {
    let ret = "";
    Object.keys(this._clauses).forEach(key => {
    });
  }
}