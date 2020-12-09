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
  if (typeof query.name === 'string' || typeof query._source.name === 'string') {
    return query;
  }

  const source = fuse(query._source);
  const keys = Object.keys(query._clauses);
  if (['concat', 'intersect', 'union', 'except'].some(clause => keys.includes(clause))) {
    return new SqlQuery(source, query._clauses, query._schema);
  }

  const source_keys = Object.keys(source._clauses);
  // fuse filter
  const source_highest_key = Math.max(...source_keys.map(key => CLAUSE_EXEC_ORDER.indexOf(key)), 0);
  if (source_highest_key === 0) {
    const where = [...(query._clauses.where || []), ...(source._clauses.where || [])];
    return new SqlQuery(source._source, {...query._clauses, ...(where.length === 0 ? {} : {where})}, query._schema);
  }

  // genearl fuse clauses
  const query_lowest_key = Math.min(...keys.map(key => CLAUSE_EXEC_ORDER.indexOf(key)), 10000);
  if (query_lowest_key > source_highest_key) {
    return new SqlQuery(source._source, {...source._clauses, ...query._clauses}, query._schema);
  }

  // fuse select
  if (query_lowest_key === 3 && source_highest_key === 3) {
    if (source._clauses.select.every(s => s.type === 'Column' && !('as' in s)))
      return new SqlQuery(source._source, {...source._clauses, ...query._clauses}, query._schema);
  }

  // do not fuse
  return new SqlQuery(source, query._clauses, query._schema);
}
