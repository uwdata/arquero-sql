import { SqlQuery } from "./sql-query";
import { EXCEPT, INTERSECT, ORDERBY } from "./constants";
import { internal, all, op } from "arquero";

const { Verbs } = internal;

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

/**
 *
 * @param {object[]} oldSchema
 * @param {object[]} selection
 */
function newSchema(oldSchema, selection) {
  const fields = selection
    .map((s) => {
      if (s.type === "Selection") {
        if (s.operator === "not") {
          return newSchema(oldSchema, s.arguments);
        } else if (s.operator === "all") {
          return oldSchema;
        }
      } else if (s.type === "Column") {
        return s.name;
      } else {
        throw new Error(
          "Selection should only contains Selection or Column but received: ",
          selection
        );
      }
    })
    .flat();
  return fields.filter((f, index) => fields.indexOf(f) === index);
}

export class SqlQueryBuilder extends SqlQuery {
  constructor(source, clauses, schema) {
    super(source, clauses, schema);
  }

  _append(clauses_fn, schema_fn) {
    return new SqlQueryBuilder(
      this._source,
      clauses_fn(this._clauses),
      schema_fn(this._schema)
    );
  }

  _wrap(clauses_fn, schema_fn) {
    return new SqlQueryBuilder(
      this,
      clauses_fn(this._clauses),
      schema_fn(this._schema)
    );
  }

  _derive(verb) {
    // TODO: check if derive does not have aggregated function
    const newFields = verb.values;
    const toKeep = newFields.map(() => true);

    let clauses;
    if (this._schema) {
      clauses = {
        select: [
          ...Verbs.select(this._schema)
            .toAST()
            .columns.map((column) => {
              const idx = newFields.find((v) => v.as === column.name);
              return idx === -1
                ? column
                : ((toKeep[idx] = false), newFields[idx]);
            }),
          ...newFields.filter((_, i) => toKeep[i]),
        ],
      };
    } else {
      clause = {
        select: [Verbs.select(all()).toAST().columns[0], ...newFields],
      };
    }
    return this._wrap(
      () => clauses,
      (schema) =>
        schema && [
          ...schema,
          newFields.filter((_, i) => toKeep[i]).map((f) => f.as),
        ]
    );
  }

  _filter(verb) {
    throw new Error("TODO: implement filter");
  }

  _groupby(verb) {
    // TODO: if groupby has expression, need to desugar to derive -> groupby
    throw new Error("TODO: implement groupby");
  }

  _rollup(verb) {
    throw new Error("TODO: implement rollup");
  }

  _count(verb) {
    const as = ("options" in verb && verb.options.as) || "count";
    return this.rollup(Verbs.rollup({ [as]: op.count() }));
  }

  _orderby(verb) {
    return this._wrap(
      () => ({ orderby: verb }),
      (schema) => schema
    );
  }

  _sample(verb) {
    if ("options" in verb && verb.options.replace) {
      throw new Error("sample does not support replace");
    }
    return this.derive(
      Verbs.derive({ ___arquero_sql_row_num_tmp___: op.row_number() })
    )
      ._append((clauses) => ({
        ...clauses,
        orderby: Verbs.orderby(op.random()),
        limit: verb.size,
      }))
      .orderby(Verbs.orderby((d) => d.___arquero_sql_row_num_tmp___))
      .select(Verbs.select(not("___arquero_sql_row_num_tmp___")));
  }

  _select(verb) {
    return this._wrap(
      // TODO: use newSchema if possible (SQL does not have 'not')
      () => ({ select: verb.columns }),
      (schema) => newSchema(schema, verb.columns)
    );
  }

  _join(verb) {
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

  _dedupe(verb) {
    if (verb.keys.some((k) => k.type !== "Column")) {
      const columns = verbs.keys.filter((k) => k.type === "Column");
      const derives = verbs.keys
        .filter((k) => k.type !== "Column")
        .map((d, idx) => ({ ...d, as: `___arquero_sql_derive_tmp_${idx}___` }));
      const deriveFields = derives.map((d) => d.as);
      return this._derive({ values: derives })
        ._append(
          (clauses) => ({
            ...clauses,
            distinct: [...columns.map((d) => d.name), ...deriveFields],
          }),
          (schema) => [...schema, ...deriveFields]
        )
        .select(Verbs.select(not(...deriveFields)));
    } else {
      return this._wrap(
        () => ({ distinct: verb.keys.map((d) => d.name) }),
        (schema) => schema
      );
    }
  }

  _concat(verb) {
    // TODO: convert verb to SqlQuery of the table
    return this._wrap(
      () => ({ concat: verb }),
      (schema) => schema
    );
  }

  _union(verb) {
    return this._wrap(
      () => ({ union: verb }),
      (schema) => schema
    );
  }

  _intersect(verb) {
    return this._wrap(
      () => ({ intersect: verb }),
      (schema) => schema
    );
  }

  _except(verb) {
    return this._wrap(
      () => ({ except: verb }),
      (schema) => schema
    );
  }

  derive(verb) {
    return this._derive(verb.toAST());
  }
  filter(verb) {
    return this._filter(verb.toAST());
  }
  groupby(verb) {
    return this._groupby(verb.toAST());
  }
  rollup(verb) {
    return this._rollup(verb.toAST());
  }
  count(verb) {
    return this._count(verb.toAST());
  }
  orderby(verb) {
    return this._orderby(verb.toAST());
  }
  sample(verb) {
    return this._sample(verb.toAST());
  }
  select(verb) {
    return this._select(verb.toAST());
  }
  join(verb) {
    return this._join(verb.toAST());
  }
  dedupe(verb) {
    return this._dedupe(verb.toAST());
  }
  concat(verb) {
    return this._concat(verb.toAST());
  }
  union(verb) {
    return this._union(verb.toAST());
  }
  intersect(verb) {
    return this._intersect(verb.toAST());
  }
  except(verb) {
    return this._except(verb.toAST());
  }
}
