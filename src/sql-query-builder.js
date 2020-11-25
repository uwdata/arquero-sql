import { SqlQuery } from "./sql-query";
import {EXCEPT, INTERSECT, ORDERBY} from './constants';
import {internal, all} from 'arquero';

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

/**
 * 
 * @param {object[]} oldSchema 
 * @param {object[]} selection 
 */
function newSchema(oldSchema, selection) {
  const fields = selection.map(s => {
    if (s.type === 'Selection') {
      if (s.operator === 'not') {
        return newSchema(oldSchema, s.arguments);
      } else if (s.operator === 'all') {
        return oldSchema;
      }
    } else if (s.type === 'Column') {
      return s.name;
    } else {
      throw new Error('Selection should only contains Selection or Column but received: ', selection);
    }
  }).flat();
  return fields.filter((f, index) => fields.indexOf(f) === index);
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
    // TODO: check if derive does not have aggregated function
    const newFields = verb.toAST().values;
    const toKeep = newFields.map(() => true);
    this.wrap(
      () => schema
        ? ({select: [
            ...internal.Verbs.select(schema).toAST().columns.map(column => {
              const idx = newFields.find(v => v.as === column.name);
              return idx === -1 ? column : (toKeep[idx] = false, newFields[idx]);
            }),
            ...newFields.filter((_, i) => toKeep[i])
          ]})
        : ({select: [internal.Verbs.select(all()).toAST().columns[0], ...newFields]}),
      schema => schema && [
        ...schema,
        newFields.filter((_, i) => toKeep[i]).map(f => f.as)
      ]
    )
  }

  filter(verb) {

  }

  groupby(verb) {
    // TODO: if groupby has expression, need to desugar to derive -> groupby

  }

  orderby(verb) {
    return this.wrap(() => ({orderby: verb}), schema => schema);
  }

  rollup(verb) {

  }

  count(verb) {

  }

  sample(verb) {
    return this.wrap(() => ({sample: verb}), schema => schema)
  }

  select(verb) {
    const fields = newSchema(this._schema, verbs.toAST().columns);
    if (this.hasConflict(CONFLICTS.select)) {
      return this.wrap(() => ({select: verb}), () => fields);
    } else {
      return this.append(clauses => ({...clauses, select: verb}), () => fields);
    }
  }

  lookup(verb) {
    return this.wrap(
      () => ({join: verb}),
      schema => schema && [
        ...schema,
        newSchema(verb.table._schema, verb.toAST().values)
          .filter(f => schema.includes(f))
      ]
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