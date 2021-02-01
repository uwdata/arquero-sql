/** @typedef {import('./sql-query').SqlQuery} SqlQuery */

import isString from 'arquero/src/util/is-string';
import { Counter } from './counter';
import createColumn from './utils/create-column';
import { GB_KEY } from './verbs/groupby';
import { genExpr } from './visitors/gen-expr';

/**
 * 
 * @param {SqlQuery|string} query 
 * @param {string} [indentStr]
 * @param {number} [indentLvl]
 * @param {Counter} [counter] 
 */
export default function codeGen(query, indentStr = '  ', indentLvl = 0, counter = new Counter()) {
  if (isString(query)) {
    return query;
  }

  /** @type {SqlQuery} */
  const {_clauses: clauses, _schema: {columns, groupby}} = query;
  const nl = indentStr ? '\n' : '  ';
  const code = [];

  const indent = () => code.push(...ind(indentLvl, indentStr));

  const tables = [null, 'table' + counter.next(), clauses.join ? 'table' + counter.next() : null];

  // SELECT
  // TODO: gen over-partitionby
  indent();
  code.push('SELECT ');
  const select = clauses.select || [...columns.map(c => createColumn(c)), ...(groupby||[]).map(c => createColumn(GB_KEY(c)))];
  const select_str = select.map(({as, ...s}) => {
    return genExpr(s, {}, tables) + (as ? `as ${as}` : '');
  }).join(', ');
  code.push(...select_str, nl);

  // FROM
  indent();
  code.push('FROM (');
  code.push(codeGen(query._source, indentStr, indentLvl + 1, counter));
  code.push(') AS ', tables[1]);
  if (clauses.join) {
    code.push(' (');
    code.push(codeGen(clauses.join.other, indentStr, indentLvl + 1, counter));
    code.push(') AS ', tables[2]);
    code.push(' ON ');
    code.push(genExpr(clauses.join.on, {}, tables));
  }
  code.push(nl);

  // WHERE
  if (clauses.where) {
    indent();
    code.push('WHERE ');
    code.push(clauses.where.map(w => genExpr(w, {}, tables).join(' AND ')));
    code.push(nl);
  }

  // GROUP BY
  if (clauses.groupby) {
    indent();
    code.push('GROUP BY ');
    code.push(clauses.groupby.map(g => genExpr(g, {}, tables).join(', ')));
    code.push(nl);
  }

  // HAVING
  // no having

  // ORDER BY
  if (clauses.orderby) {
    indent();
    code.push('ORDER BY ');
    code.push(clauses.orderby.map(g => genExpr(g, {}, tables).join(', ')));
    code.push(nl);
  }

  // LIMIT
  if (clauses.limit !== undefined || clauses.limit !== null) {
    indent();
    code.push('LIMIT ', clauses.limit, nl);
  }

  // SET VERBS
  ['concat', 'except', 'intersect', 'union'].forEach(verb => {
    if (clauses[verb]) {
      clauses[verb].forEach(q => {
        indent();
        code.push(verb.toUpperCase(), ' (');
        code.push(codeGen(q, indentStr, indentLvl + 1, counter));
        code.push(')', nl);
      });
    }
  });
}

/**
 * 
 * @param {number} indentLvl 
 * @param {string} indentStr 
 */
function ind(indentLvl, indentStr) {
  const ret = [];
  for (let i = 0; i < indentLvl; i++) {
    ret.push(indentStr);
  }
  return ret;
}