import {SqlQuery} from '../../src/sql-query';
import {internal} from 'arquero';

export const {Verbs} = internal;
export const base = new SqlQuery('base', ['a', 'b', 'c', 'd']);
export const base2 = new SqlQuery('base2', ['a', 'b', 'c', 'd', 'e']);
export const base3 = new SqlQuery('base3', ['a', 'b', 'c', 'e']);
// export const noschema = new SqlQuery('no-schema');
export const group = base.groupby('a', 'b');

/**
 * deep copy an object
 * @param {object} obj object to copy
 * @returns copied of obj
 */
export function copy(obj) {
  return JSON.parse(JSON.stringify(objToString(obj)));
}

function objToString(obj) {
  if (Array.isArray(obj)) {
    return obj.map(o => objToString(o));
  } else if (typeof obj === 'function') {
    return obj.toString();
  } else if (typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [k, v]) => ((acc[k] = objToString(v)), acc), {});
  } else {
    return obj;
  }
}

/**
 * convert a 1-table JS expression to AST
 * @param {function} expr function expression
 * @param {string} [as] result column name
 * @returns AST of expr
 */
export function toAst(expr, as) {
  const _as = as ? {as} : {};
  return {...copy(Verbs.filter(expr).toAST().criteria), ..._as};
}

/**
 * convert a 2-table JS expression to AST
 * @param {function} expr function expression
 * @returns AST of expr
 */
export function twoTableExprToAst(expr) {
  return copy(Verbs.join('t', expr, [[], []], {}).toAST().on);
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

export function pprint(json, indent = 2) {
  console.log('------------------------------------');
  console.log(JSON.stringify(json, null, indent));
  console.log('------------------------------------');
}
