/** @typedef {import('./pg-table-view').PosgresTableView} PosgresTableView */

import isString from 'arquero/src/util/is-string';
import createColumn from './utils/create-column';
import {GB_KEY} from './verbs/groupby';
import {genExpr} from './visitors/gen-expr';

/**
 *
 * @param {PosgresTableView|string} query
 * @param {string} [indentStr]
 * @param {number} [indentLvl]
 * @param {Counter} [counter]
 */
export default function postgresCodeGen(query, indentStr = '  ', indentLvl = 0, counter = new Counter()) {
  /** @type {string[]} */
  const code = [];
  const indent = _indent(indentLvl, indentStr).join('');
  const nl = indentStr ? '\n' : ' ';

  if (isString(query)) {
    code.push(indent);
    code.push(query, nl);
    return code.join('');
  }

  /** @type {PosgresTableView} */
  const {_clauses, _columns, _group, _order} = query;

  const tables = ['table' + counter.next(), _clauses.join ? 'table' + counter.next() : null];
  const partition = _group && _group.map(GB_KEY).join(',');
  const order = _order && genOrderClause(_order, {partition, tables});

  const opt = {partition, order, tables};

  // SELECT
  code.push(indent);
  code.push('SELECT ');
  const select = _clauses.select || [
    ..._columns.map(c => createColumn(c)),
    ...(_group || []).map(c => createColumn(GB_KEY(c))),
  ];
  const select_str = select
    .map(({as, ...s}) => {
      const expr = genExpr(s, {...opt, withoutOver: !!_clauses.groupby});
      const _as = as ? ` AS ${as}` : '';
      return expr + _as;
    })
    .join(',');
  code.push(...select_str, nl);

  // FROM
  code.push(indent);
  code.push('FROM ');
  if (typeof query._source === 'string') {
    code.push(query._source);
  } else {
    code.push('(', nl);
    code.push(postgresCodeGen(query._source, indentStr, indentLvl + 1, counter));
    code.push(indent);
    code.push(')');
  }
  code.push(' AS ', tables[0]);
  if (_clauses.join) {
    code.push(' ', _clauses.join.join_type, ' JOIN ');
    if (typeof _clauses.join.other === 'string') {
      code.push(_clauses.join.other);
    } else {
      code.push('(', nl);
      code.push(postgresCodeGen(_clauses.join.other, indentStr, indentLvl + 1, counter));
      code.push(indent);
      code.push(')');
    }
    code.push(' AS ', tables[1]);
    if (_clauses.join.on) {
      code.push(' ON ');
      code.push(genExpr(_clauses.join.on, opt));
    }
  }
  code.push(nl);

  // WHERE
  if (_clauses.where) {
    code.push(indent);
    code.push('WHERE ');
    code.push(genExprList(_clauses.where, opt, ' AND '));
    code.push(nl);
  }

  // GROUP BY
  if (Array.isArray(_clauses.groupby)) {
    code.push(indent);
    code.push('GROUP BY ');
    code.push(genExprList(_clauses.groupby, opt, ','));
    code.push(nl);
  }

  // HAVING
  if (_clauses.having) {
    code.push(indent);
    code.push('HAVING ');
    code.push(genExprList(_clauses.having, opt, ' AND '));
    code.push(nl);
  }

  // ORDER BY
  if (_clauses.orderby) {
    code.push(indent);
    code.push('ORDER BY ');
    code.push(genOrderClause(_clauses.orderby, {partition, tables}));
    code.push(nl);
  }

  // LIMIT
  if (_clauses.limit || _clauses.limit === 0) {
    code.push(indent);
    code.push('LIMIT ', _clauses.limit, nl);
  }

  // SET VERBS
  ['concat', 'except', 'intersect', 'union']
    .filter(verb => _clauses[verb])
    .forEach(verb => {
      _clauses[verb].forEach(q => {
        code.push(indent);
        code.push(verb.toUpperCase(), ' (', nl);
        code.push(postgresCodeGen(q, indentStr, indentLvl + 1, counter));
        code.push(')', nl);
      });
    });

  return code.join('');
}

export class Counter {
  constructor() {
    this.counter = 0;
  }

  next() {
    return this.counter++;
  }
}

/**
 *
 * @param {import('./pg-table-view').OrderInfo} orderby
 * @param {import('../../visitors/gen-expr').GenExprOpt} opt
 * @returns {string}
 */
function genOrderClause(orderby, opt) {
  const {exprs, descs} = orderby;
  return exprs.map((g, i) => genExpr(g, opt) + (descs[i] ? ' DESC' : '')).join(',');
}

/**
 *
 * @param {import('./pg-table-view').AstNode[]} list
 * @param {import('../../visitors/gen-expr').GenExprOpt} opt
 * @param {string} delim
 */
function genExprList(list, opt, delim) {
  return list.map(n => genExpr(n, opt)).join(delim);
}

/**
 *
 * @param {number} indentLvl
 * @param {string} indentStr
 */
function _indent(indentLvl, indentStr) {
  const ret = [];
  for (let i = 0; i < indentLvl; i++) {
    ret.push(indentStr);
  }
  return ret;
}
