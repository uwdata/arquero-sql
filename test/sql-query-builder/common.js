import {SqlQueryBuilder} from '../../src/sql-query-builder';
import {internal} from 'arquero';

export const {Verbs} = internal;
export const base = new SqlQueryBuilder('table-name', null, {columns: ['a', 'b', 'c', 'd']});
export const noschema = new SqlQueryBuilder('table-name', null);
export const baseWithGroupBy = new SqlQueryBuilder('table-name', null, {
  columns: ['a', 'b', 'c', 'd'],
  groupby: ['a', 'b'],
});

/**
 * deep copy an object
 * @param {object} obj object to copy
 * @returns copied of obj
 */
export function copy(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * convert a JS expression to AST
 * @param {function} expr function expression
 * @param {string} [as] result column name
 * @returns AST of expr
 */
export function toAst(expr, as) {
  return {...copy(Verbs.filter(expr).toAST().criteria), ...(as ? {as} : {})};
}

/**
 * deep equal tests of all actuals and expected
 * @param {object} t tape object
 * @param {object[]} actuals list of actual values to compare
 * @param {[object, string][]} expecteds list of expected values to compare
 */
export function deepEqualAll(t, actuals, expecteds) {
  if (actuals.length !== expecteds.length) {
    t.fail('actuals and expecteds should have same length but received ' + `${actuals.length} and ${expecteds.length}`);
  }

  expecteds.forEach(([expected, message], idx) => t.deepEqual(copy(actuals[idx]), expected, message));
}