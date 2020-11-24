import { SqlQuery } from "./sql-query";

/*
SQL execution order:
- from / join
- where
- group by
- having
- select
- distinct
- order by
- limit / offset
*/

const EXEC_ORDER = [
  'where',
  'groupby',
  'having',
  'join',  // joining in arquero includes select, always wrap?
  'derive', // same as select?
  'select',
  'orderby',
  'dedupe',
  'sample', // sample includes limit + order, always wrap?

  // always wrap
  'concat',
  'union',
  'intersect',
  'except'
]

export class SqlQueryBuilder extends SqlQuery {
  derive(verb) {
    // return this.new_query(
    //   verbs => ({...verbs, derive: [...(this._verbs.derive || []), verb]}),
    //   schema => schema && {
    //     ...schema,
    //     fields: [...schema.fields, ...verb.values.map(v => v.as)]
    //   }
    // )

    if (this._clauses.select || this._clauses.orderby || this._clauses.sample) {

    }
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

  filter(verb) {

  }

  groupby(verb) {

  }

  orderby(verb) {

  }

  rollup(verb) {

  }

  count(verb) {

  }

  sample(verb) {
  }

  select(verb) {

  }

  lookup(verb) {
    // always create new query when lookup / join
    // TODO: do we need to wrap in another new query??
    return new SqlQuery(
      this,
      {join: verb},
      {fields: [...this._schema.fields, /* from other talbe */verb]}
    )
  }

  dedupe(verb) {

  }

  concat(verb) {
    return this.wrap(() => ({concat: verb}), schema => schema)
  }

  union(verb) {
    return this.wrap(() => ({union: verb}), schema => schema)
  }

  intersect(verb) {
    return this.wrap(() => ({intersect: verb}), schema => schema)
  }

  except(verb) {
    return this.wrap(() => ({except: verb}), schema => schema)
  }
}