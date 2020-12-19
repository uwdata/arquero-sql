import {SqlQuery} from './sql-query';
import {internal, not, op} from 'arquero';
import {createColumn, isFunction, resolveColumns} from './utils';
import {hasAggregation} from './visitors/has-aggregation';

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

const ROW_NUM_TMP = '___arquero_sql_row_num_tmp___';

export function fromQuery(query, schema) {
  return query._verbs.reduce((acc, verb) => acc[verb.verb](verb), new SqlQueryBuilder(query._table, {}, schema));
}

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
    if (verb.values.some(d => hasAggregation(d))) {
      throw new Error('Derive does not allow aggregated operations');
    }

    const fields = verb.values.filter(value => value.type !== 'Column' || value.name !== value.as);
    const keep = fields.map(() => true);

    const clauses = this._schema
      ? {
          select: [
            ...this._schema.columns.map(createColumn).map(column => {
              const idx = fields.findIndex(v => v.as === column.name);
              return idx === -1 ? column : ((keep[idx] = false), fields[idx]);
            }),
            ...fields.filter((_, i) => keep[i]),
          ],
        }
      : {select: [createColumn('*'), ...fields]};

    const columns = this._schema && [...this._schema.columns, ...fields.filter((_, i) => keep[i]).map(f => f.as)];
    return this._wrap(clauses, this._schema && {columns});
  }

  _filter(verb) {
    const having = [];
    const where = [];
    verb.criteria.forEach(criterion => (hasAggregation(criterion) ? having : where).push(criterion));
    if (this.isGrouped()) {
      return this._append(clauses => {
        const new_where = [...(clauses.where || []), ...where];
        const new_having = [...(clauses.having || []), ...having];

        return {
          ...clauses,
          ...(new_where.length > 0 ? {where: new_where} : {}),
          ...(new_having.length > 0 ? {having: new_having} : {}),
        };
      }, this._schema);
    } else {
      if (having.length > 0) {
        throw new Error('Cannot fillter using aggregate operations without groupby');
      }

      return this._wrap(verb.criteria.length > 0 ? {where: verb.criteria} : {}, this._schema);
    }
  }

  _groupby(verb) {
    const keys = [];
    const addKey = key => {
      const index = keys.findIndex(k => (k.as || k.name) === (key.as || key.name));
      index === -1 ? keys.push(key) : (keys[index] = key);
    };

    verb.keys.forEach(key => {
      if (key.type === 'Selection') {
        const columns = resolveColumns(this._schema, [key]);
        if (columns === null) {
          throw new Error('Cannot resolve not/all selection without schema');
        }
        columns.forEach(name => addKey(createColumn(name)));
      } else {
        addKey(key);
      }
    });

    const groupby = keys.map(key => key.as || key.name);
    if (keys.some(key => key.as)) {
      return this._derive({values: keys.filter(key => key.as)}).groupby(groupby);
    } else {
      return this._wrap({groupby, select: groupby.map(c => createColumn(c))}, {...(this._schema || []), groupby});
    }
  }

  _rollup(verb) {
    const columns = verb.values.map(value => value.as);
    if (this.isGrouped()) {
      return this._append(
        clauses => ({
          ...clauses,
          select: [
            ...this._schema.groupby.map(name => {
              const index = verb.values.findIndex(value => value.as === name);
              return index === -1 ? createColumn(name) : verb.values[index];
            }),
            ...verb.values.filter(value => !this._schema.groupby.includes(value.as)),
          ],
        }),
        {columns: [...this._schema.groupby, ...columns]},
      );
    } else {
      return this._wrap({select: verb.values}, {columns});
    }
  }

  _count(verb) {
    const as = ('options' in verb && verb.options.as) || 'count';
    return this.rollup({[as]: op.count()});
  }

  _orderby(verb) {
    return this._wrap({orderby: verb.keys}, this._schema);
  }

  _sample(verb) {
    if ('options' in verb && verb.options.replace) {
      throw new Error('sample does not support replace');
    }

    return this.derive({[ROW_NUM_TMP]: op.row_number()})
      ._append(
        clauses => ({
          ...clauses,
          orderby: Verbs.orderby([() => op.random()]).toAST().keys,
          limit: verb.size,
        }),
        schema => schema,
      )
      .orderby([ROW_NUM_TMP])
      .select([not(ROW_NUM_TMP)]);
  }

  _select(verb) {
    if (!this._schema && verb.columns.some(column => column.type === 'Selection')) {
      throw new Error("Cannot select with 'all' or 'not' without schema");
    }

    const columns = [];
    const addColumn = column => {
      const index = columns.findIndex(c => c.name === column.name);
      index === -1 ? columns.push(column) : (columns[index] = column);
    };

    verb.columns.forEach(column => {
      if (column.type === 'Selection') {
        resolveColumns(this._schema, [column]).forEach(name => addColumn(createColumn(name)));
      } else if (column.type === 'Column') {
        addColumn(column);
      } else {
        throw new Error('Can only select with selection expressions or column names, but received: ', column);
      }
    });

    return this._wrap(
      {select: columns},
      {
        columns: columns.map(column => column.as || column.name),
      },
    );
  }

  // eslint-disable-next-line
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
    if (verb.keys.some(k => k.type !== 'Selection' || k.operator !== 'all')) {
      throw new Error('SQL can only dedupe all fields');
    } else {
      return this._wrap({distinct: true}, this._schema);
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

  _appendVerb(params, name) {
    if (this.isGrouped()) {
      throw new Error('Need a rollup/count after a groupby before ' + name);
    }
    return this._appendVerbAllowingGroupby(params, name);
  }

  /**
   * @param {any[]} params a list of parameters for the verb
   * @param {string} name name of the verb
   * @returns {SqlQueryBuilder}
   */
  _appendVerbAllowingGroupby(params, name) {
    return this['_' + name](Verbs[name](...params).toAST());
  }

  isGrouped() {
    return this._schema && 'groupby' in this._schema;
  }

  derive(...params) {
    return this._appendVerb(params, 'derive');
  }
  filter(...params) {
    return this._appendVerbAllowingGroupby(params, 'filter');
  }
  groupby(...params) {
    return this._appendVerb([params.flat()], 'groupby');
  }
  rollup(...params) {
    return this._appendVerbAllowingGroupby(params, 'rollup');
  }
  count(...params) {
    return this._appendVerbAllowingGroupby(params, 'count');
  }
  orderby(...params) {
    return this._appendVerb([params.flat()], 'orderby');
  }
  sample(...params) {
    return this._appendVerb(params, 'sample');
  }
  select(...params) {
    return this._appendVerb([params.flat()], 'select');
  }
  join(...params) {
    return this._appendVerb(params, 'join');
  }
  dedupe(...params) {
    return this._appendVerb(params, 'dedupe');
  }
  concat(...params) {
    return this._appendVerb(params, 'concat');
  }
  union(...params) {
    return this._appendVerb(params, 'union');
  }
  intersect(...params) {
    return this._appendVerb(params, 'intersect');
  }
  except(...params) {
    return this._appendVerb(params, 'except');
  }
}
