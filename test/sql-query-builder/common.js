import {SqlQueryBuilder} from '../../src/sql-query-builder';
import {internal} from 'arquero';

export const {Verbs} = internal;
export const base = new SqlQueryBuilder('table-name', null, {columns: ['a', 'b', 'c', 'd']});
export const noschema = new SqlQueryBuilder('table-name', null);
export const baseWithGroupBy = new SqlQueryBuilder('table-name', null, {
  columns: ['a', 'b', 'c', 'd'],
  groupby: ['a', 'b'],
});

export function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
