import {SqlQuery} from './sql-query';

const CLAUSE_EXEC_ORDER = [
  'where',
  'groupby',
  'having',
  'select',
  'distinct',
  'orderby',
  'limit',
  'concat',
  'union',
  'intersect',
  'except',
];

/**
 *
 * @param {SqlQuery} query
 * @returns {SqlQuery}
 */
export function fuse(query) {
  if (typeof query === 'string' || typeof query._source === 'string') {
    return query;
  }

  const source = fuse(query._source);
  const keys = Object.keys(query._clauses);
  if (['concat', 'intersect', 'union', 'except'].some(clause => keys.includes(clause))) {
    return new SqlQuery(source, query._clauses, query._schema);
  }

  const source_keys = Object.keys(source._clauses);
  const source_highest_key = Math.max(source_keys.map(key => CLAUSE_EXEC_ORDER.indexOf(key)));
  if (source_highest_key === 0) {
    return new SqlQuery(
      source._source,
      {...query._clauses, where: [...(query._clauses.where || []), ...source._clauses.where]},
      query._schema,
    );
  }

  const query_lowest_key = Math.min(keys.map(key => CLAUSE_EXEC_ORDER.indexOf(key)));
  if (query_lowest_key > source_highest_key) {
    return new SqlQuery(source._source, {...source._clauses, ...query._clauses}, query._schema);
  }

  if (query_lowest_key === 3 && source_highest_key === 3) {
    if (source._clauses.select.all(s => s.type === 'Column' && !('as' in s)))
      return new SqlQuery(source._source, {...source._clauses, ...query._clauses}, query._schema);
  }

  return new SqlQuery(source, query._clauses, query._schema);
}
