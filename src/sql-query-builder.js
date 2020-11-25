import { SqlQuery } from "./sql-query";
import {EXCEPT, INTERSECT, ORDERBY} from './constants';

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

const SET_OPS = [CONCAT, UNION, INTERSECT, EXCEPT];

const CONFLICTS = {
  derive: [ORDERBY, SAMPLE, ...SET_OPS],
  filter: [SELECT, ORDERBY, SAMPLE, ...SET_OPS],
  groupby: [GROUPBY, SELECT, ORDERBY, SAMPLE, ...SET_OPS],
  select: [SELECT, ORDERBY, SAMPLE, ...SET_OPS],
  orderby: [ORDERBY, SAMPLE, ...SET_OPS],
  dedupe: [ORDERBY, SAMPLE, ...SET_OPS],
}

function newSchema(oldSchema, selection) {
  
}

export class SqlQueryBuilder extends SqlQuery {
  constructor(source, clauses, schema) {
    super(source, clauses, schema);
  }

  append(clauses_fn, schema_fn) {
    return new SqlQueryBuilder(
      this._source,
      clauses_fn(this._clauses),
      schema_fn(this._schema),
    );
  }

  wrap(clauses_fn, schema_fn) {
    return new SqlQueryBuilder(
      this,
      clauses_fn(this._clauses),
      schema_fn(this._schema),
    );
  }

  /**
   * check if current clauses have conflicts
   * @param {string[]} conflicts list of conflicting clauses
   */
  hasConflict(conflicts) {
    return Object.keys(this._clauses).some(clause => conflicts.includes(clause));
  }

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

  filter(verb) {

  }

  groupby(verb) {
    // TODO: if groupby has expression, need to desugar to derive -> groupby

  }

  orderby(verb) {
    if (this.hasConflict(CONFLICTS.orderby)) {
      return this.wrap(() => ({orderby: verb}), schema => schema);
    } else {
      return this.append(clauses => ({...clauses, orderby: verb}), schema => schema);
    }
  }

  rollup(verb) {

  }

  count(verb) {

  }

  sample(verb) {
    return this.wrap(() => ({sample: verb}), schema => schema)
  }

  select(verb) {
    const fields = verbs.toAST().conlumns;
    if (this.hasConflict(CONFLICTS.select)) {
      return this.wrap(() => ({select: verb}), () => ({fields}));
    } else {
      return this.append(clauses => ({...clauses, select: verb}), schema => ({fields}));
    }
  }

  lookup(verb) {
    return this.wrap(
      () => ({join: verb}),
      schema => schema && ({
        ...schema,
        fields: [
          ...schema.fields,
          // TODO: need to support field names with expressions (not, all)
          verb.toAST().values.map(value => value.name)
        ]
      })
    );
  }

  dedupe(verb) {
    // TODO: if dedupe has expression, need to desugar to derive -> dedupe -> select
    if (this.hasConflict(CONFLICTS.dedupe)) {
      return this.wrap((() => ({dedupe: [verb]}), schema => schema))
    } else {
      return this.append(clauses => ({
        ...clauses, 
        dedupe: [
          ...('dedupe' in clauses ? clauses.dedupe : []),
          verb
        ]
      }), schema => schema)
    }
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