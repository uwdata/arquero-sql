/** @typedef { import('../../sql-query').SqlQuery } SqlQuery */
/** @typedef { import('../../utils').ColumnType } ColumnType */

import {createColumn} from '../../utils';

/**
 * 
 * @param {SqlQuery} query 
 * @param {object|object[]} sel 
 * @param {Map} map 
 */
export default function resolve(query, sel, map = new Map()) {
  if (Array.isArray(sel)) {
    sel.forEach(r => resolve(query, r, map));
  } else if (sel.type === 'Column') {
    const name = getColumnName(query, sel);
    map.set(sel.as || name, name);
  } else if (sel.type === 'Selection') {
    resolve(query, selections[sel](query, sel.arguments), map);
  }

  return map;
}

/**
 * 
 * @param {SqlQuery} query 
 * @param {object} column 
 */
function getColumnName(query, column) {
  return 'index' in column ? query._schema.columns[column.index] : column.name;
}

/**
 * 
 * @param {SqlQuery} query 
 * @param {object} column 
 */
function getColumnIndex(query, column) {
  return 'name' in column ? query._schema.columns.indexOf(column.name) : column.index;
}

/**
 * 
 * @param {SqlQuery} query 
 */
function all(query) {
  return query._schema.columns.map(c => createColumn(c));
}

/**
 * 
 * @param {SqlQuery} query 
 * @param {object|object[]} selection 
 */
function not(query, selection) {
  const drop = resolve(query, selection);
  return query._schema.columns.filter(name => !drop.has(name));
}

/**
 * 
 * @param {SqlQuery} query 
 * @param {[ColumnType, ColumnType]} param1 
 */
function range(query, [start, end]) {
  let i = getColumnIndex(query, start);
  let j = getColumnIndex(query, end);
  if (i < j) { const t = j; j = i; i = t; }
  return query._schema.columns
    .slice(i, j + 1)
    .map(c => createColumn(c));
}

/**
 * 
 * @param {SqlQuery} query 
 * @param {[string, string]} param1 
 */
function matches(query, [pattern, flags]) {
  const regex = RegExp(pattern, flags);
  return query._schema.columns
    .filter(name => regex.test(name))
    .map(c => createColumn(c));
}

const selections = {
  all,
  not,
  range,
  matches,
};