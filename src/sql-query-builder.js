import { SqlQuery } from "./sql-query";
import {EXCEPT, INTERSECT, ORDERBY} from './constants';
import {internal, all, op} from 'arquero';

const {Verbs} = internal;

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

function verbToAST(verb) {
  return typeof verb.toAST === 'function' ? verb.toAST() : verb;
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
    verb = verbToAST(verb);
    // TODO: check if derive does not have aggregated function
    const newFields = verb.values;
    const toKeep = newFields.map(() => true);
    return this.wrap(
      () => schema
        ? ({select: [
            ...Verbs.select(schema).toAST().columns.map(column => {
              const idx = newFields.find(v => v.as === column.name);
              return idx === -1 ? column : (toKeep[idx] = false, newFields[idx]);
            }),
            ...newFields.filter((_, i) => toKeep[i])
          ]})
        : ({select: [Verbs.select(all()).toAST().columns[0], ...newFields]}),
      schema => schema && [
        ...schema,
        newFields.filter((_, i) => toKeep[i]).map(f => f.as)
      ]
    )
  }

  filter(verb) {
    verb = verbToAST(verb);
    throw new Error("TODO: implement filter");
  }

  groupby(verb) {
    verb = verbToAST(verb);
    // TODO: if groupby has expression, need to desugar to derive -> groupby
    throw new Error("TODO: implement groupby");
  }

  rollup(verb) {
    verb = verbToAST(verb);
    throw new Error("TODO: implement rollup");
  }

  count(verb) {
    verb = verbToAST(verb);
    return this.rollup(Verbs.rollup({[('options' in verb && verb.options.as) || 'count']: op.count()}))
  }

  orderby(verb) {
    verb = verbToAST(verb);
    return this.wrap(() => ({orderby: verb}), schema => schema);
  }

  sample(verb) {
    verb = verbToAST(verb);
    if ('options' in verb && verb.options.replace) {
      throw new Error("sample does not support replace");
    }
    return this
      .derive(Verbs.derive({___arquero_sql_row_num_tmp___: op.row_number()}))
      .append(clauses => ({
        ...clauses,
        orderby: Verbs.orderby(op.random()),
        limit: verb.size
      }))
      .orderby(Verbs.orderby(d => d.___arquero_sql_row_num_tmp___))
      .select(Verbs.select(not('___arquero_sql_row_num_tmp___')))
  }

  select(verb) {
    verb = verbToAST(verb);
    return this.wrap(
      () => ({select: verb.columns}),
      () => newSchema(this._schema, verb.columns),
    );
  }

  join(verb) {
    verb = verbToAST(verb);
    throw new Error("TODO: implement join");
    // return this.wrap(
    //   () => ({join: verb}),
    //   schema => schema && [
    //     ...schema,
    //     newSchema(verb.table._schema, verb.toAST().values)
    //       .filter(f => schema.includes(f))
    //   ]
    // );
  }

  dedupe(verb) {
    verb = verbToAST(verb);
    if (verb.keys.some(k => k.type !== 'Column')) {
      const columns = verbs.keys.filter(k => k.type === 'Column');
      const derives = verbs.keys
        .filter(k => k.type !== 'Column')
        .map((d, idx) => ({...d, as: `___arquero_sql_derive_tmp_${idx}___`}));
      const deriveFields = derives.map(d => d.as);
      return this
        .derive({values: derives})
        .append(
          clauses => ({...clauses, distinct: [...columns.map(d => d.name), ...deriveFields]}),
          schema => [...schema, ...deriveFields]
        )
        .select(Verbs.select(not(...deriveFields)));
    } else {
      return this.wrap(
        () => ({distinct: verb.keys.map(d => d.name)}),
        schema => schema
      );
    }
  }

  concat(verb) {
    verb = verbToAST(verb);
    // TODO: convert verb to SqlQuery of the table
    return this.wrap(() => ({concat: verb}), schema => schema)
  }

  union(verb) {
    verb = verbToAST(verb);
    return this.wrap(() => ({union: verb}), schema => schema)
  }

  intersect(verb) {
    verb = verbToAST(verb);
    return this.wrap(() => ({intersect: verb}), schema => schema)
  }

  except(verb) {
    verb = verbToAST(verb);
    return this.wrap(() => ({except: verb}), schema => schema)
  }
}