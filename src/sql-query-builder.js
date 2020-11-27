import {SqlQuery} from './sql-query';
import {EXCEPT, INTERSECT, ORDERBY} from './constants';
import {internal, all, op} from 'arquero';
import {selectFromSchema, isFunction} from './utils';

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
};

const ROW_NUM_TMP = '___arquero_sql_row_num_tmp___';

export class SqlQueryBuilder extends SqlQuery {
  constructor(source, clauses, schema) {
    super(source, clauses, schema);
  }

  _append(clauses, schema) {
    return new SqlQueryBuilder(
      this._source,
      isFunction(clauses) ? clauses(this._clauses, this._schema) : clauses,
      isFunction(schema) ? schema(this._schema, this._clauses) : schema,
    );
  }

  _wrap(clauses, schema) {
    return new SqlQueryBuilder(
      this,
      isFunction(clauses) ? clauses(this._clauses, this._schema) : clauses,
      isFunction(schema) ? schema(this._schema, this._clauses) : schema,
    );
  }

  _derive(verb) {
    // TODO: check if derive does not have aggregated function
    const fields = verb.values;
    const keep = fields.map(() => true);

    let clauses;
    if (this._schema) {
      clauses = {
        select: [
          ...Verbs.select(this._schema.columns)
            .toAST()
            .columns.map(column => {
              const idx = fields.find(v => v.as === column.name);
              return idx === -1 ? column : ((keep[idx] = false), fields[idx]);
            }),
          ...fields.filter((_, i) => keep[i]),
        ],
      };
    } else {
      // TODO: make this one cleaner.
      const allfields = Verbs.select(all()).toAST().columns[0];
      clauses = {select: [allfields, ...fields]};
    }

    const columns = this._schema && [...this._schema.columns, fields.filter((_, i) => keep[i]).map(f => f.as)];
    return this._wrap(clauses, this._schema && {columns});
  }

  _filter(verb) {
    throw new Error('TODO: implement filter');
  }

  _groupby(verb) {
    // TODO: if groupby has expression, need to desugar to derive -> groupby
    throw new Error('TODO: implement groupby');
  }

  _rollup(verb) {
    throw new Error('TODO: implement rollup');
  }

  _count(verb) {
    const as = ('options' in verb && verb.options.as) || 'count';
    return this.rollup(Verbs.rollup({[as]: op.count()}));
  }

  _orderby(verb) {
    return this._wrap({orderby: verb.keys}, this._schema);
  }

  _sample(verb) {
    if ('options' in verb && verb.options.replace) {
      throw new Error('sample does not support replace');
    }

    return this.derive(Verbs.derive({[ROW_NUM_TMP]: op.row_number()}))
      ._append(
        clauses => ({
          ...clauses,
          orderby: Verbs.orderby(op.random()).toAST().keys,
          limit: verb.size,
        }),
        schema => schema,
      )
      .orderby(Verbs.orderby(ROW_NUM_TMP))
      .select(Verbs.select(not(ROW_NUM_TMP)));
  }

  _select(verb) {
    const columns = selectFromSchema(this._schema, verb.columns);
    // TODO: look at this case: table.select({ colA: 'newA', colB: 'newB' })
    return this._wrap(columns ? columns : {select: verb.columns}, this._schema && {columns});
  }

  _join(verb) {
    throw new Error('TODO: implement join');
    // return this.wrap(
    //   () => ({join: verb}),
    //   schema => schema && [
    //     ...schema,
    //     newSchema(verb.table._schema, verb.toAST().values)
    //       .filter(f => schema.includes(f))
    //   ]
    // );
  }

  _dedupe(verb) {
    if (verb.keys.some(k => k.type !== 'Column' && k.type !== 'Selection')) {
      if (!this._schema) {
        throw new Error("Dedupe with expressions requires table's schema");
      }

      const columns = verbs.keys.filter(k => k.type === 'Column' || k.type === 'Selection');
      const derives = verbs.keys
        .filter(k => k.type !== 'Column' && k.type !== 'Selection')
        .map((d, idx) => ({...d, as: `___arquero_sql_derive_tmp_${idx}___`}));
      const deriveFields = derives.map(d => d.as);

      return this._derive({values: derives})
        ._append(
          (clauses, schema) => ({
            ...clauses,
            distinct: [...selectFromSchema(schema, columns), ...deriveFields],
          }),
          schema => ({columns: [...schema.columns, ...deriveFields]}),
        )
        .select(Verbs.select(not(...deriveFields)));
    } else {
      const distinct = selectFromSchema(this._schema, verb.keys);
      if (!distinct) {
        throw new Error("Dedupe with 'not' or 'all' requires table's schema");
      }
      return this._wrap({distinct}, this._schema);
    }
  }

  _concat(verb) {
    return this._wrap({concat: verb.tables}, this._schema);
  }

  _union(verb) {
    return this._wrap({union: verb.tables}, this._schema);
  }

  _intersect(verb) {
    return this._wrap({intersect: verb.tables}, this._schema);
  }

  _except(verb) {
    return this._wrap({except: verb.tables}, this._schema);
  }

  _appendVerb(verb, name) {
    if (this.isGrouped()) {
      throw new Error('Need a rollup/count after a groupby before ' + name);
    }
    return this._appendVerbAllowingGroupby(verb, name);
  }

  _appendVerbAllowingGroupby(verb, name) {
    return this['_' + name](verb.toAST());
  }

  isGrouped() {
    return 'groupby' in this._schema;
  }

  derive(verb) {
    return this._appendVerb(verb, 'derive');
  }
  filter(verb) {
    return this._appendVerbAllowingGroupby(verb, 'filter');
  }
  groupby(verb) {
    return this._appendVerb(verb, 'groupby');
  }
  rollup(verb) {
    return this._appendVerbAllowingGroupby(verb, 'rollup');
  }
  count(verb) {
    return this._appendVerbAllowingGroupby(verb, 'count');
  }
  orderby(verb) {
    return this._appendVerb(verb, 'orderby');
  }
  sample(verb) {
    return this._appendVerb(verb, 'sample');
  }
  select(verb) {
    return this._appendVerb(verb, 'select');
  }
  join(verb) {
    return this._appendVerb(verb, 'join');
  }
  dedupe(verb) {
    return this._appendVerb(verb, 'dedupe');
  }
  concat(verb) {
    return this._appendVerb(verb, 'concat');
  }
  union(verb) {
    return this._appendVerb(verb, 'union');
  }
  intersect(verb) {
    return this._appendVerb(verb, 'intersect');
  }
  except(verb) {
    return this._appendVerb(verb, 'except');
  }
}
