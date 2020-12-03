import {SqlQuery} from "./sql-query";

export class SqlOptimizer extends SqlQuery{
  constructor(source, clauses, schema) {
    super(source, clauses, schema);
  }
  _join() {
    if(this._clauses.join) return "hello"
    else return "world"
  }
  _optimize(query, name){
    return this['_' + name](query)
  }

  optimize(query, name){
    return this._optimize(query, name)
  }
}