/** @typedef {import('./sql-query').SqlQuery} SqlQuery */

import isString from 'arquero/src/util/is-string';
import {Counter} from './counter';
import createColumn from './utils/create-column';
import {GB_KEY} from './verbs/groupby';
import {genExpr} from './visitors/gen-expr';

/**
 *
 * @param {SqlQuery|string} query
 * @param {string} [indentStr]
 * @param {number} [indentLvl]
 * @param {Counter} [counter]
 */
export default function codeGen(query, indentStr = '  ', indentLvl = 0, counter = new Counter()) {
  const code = [];
  const indent = _indent(indentLvl, indentStr).join('');
  const nl = indentStr ? '\n' : ' ';

  if (isString(query)) {
    code.push(indent);
    code.push(query, nl);
    return code.join('');
  }

  /** @type {SqlQuery} */
  const {_clauses, _columns, _group, _order} = query;

  const tables = ['table' + counter.next(), _clauses.join ? 'table' + counter.next() : null];
  const partition = _group && _group.map(GB_KEY).join(',');
  const orderExpr = (g, i) => genExpr(g, {partition, tables}) + (_order.descs[i] ? ' DESC' : '');
  const order = _order && _order.exprs.map(orderExpr).join(',');

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
      const expr = genExpr(s, opt);
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
    code.push(codeGen(query._source, indentStr, indentLvl + 1, counter));
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
      code.push(codeGen(_clauses.join.other, indentStr, indentLvl + 1, counter));
      code.push(indent);
      code.push(')');
    }
    code.push(' AS '[1]);
    code.push(' ON ');
    code.push(genExpr(_clauses.join.on, opt));
  }
  code.push(nl);

  // WHERE
  if (_clauses.where) {
    code.push(indent);
    code.push('WHERE ');
    code.push(_clauses.where.map(w => genExpr(w, opt)).join(' AND '));
    code.push(nl);
  }

  // GROUP BY
  if (_clauses.groupby) {
    code.push(indent);
    code.push('GROUP BY ');
    code.push(partition);
    code.push(nl);
  }

  // HAVING
  if (_clauses.having) {
    code.push(indent);
    code.push('HAVING ');
    code.push(_clauses.having.map(w => genExpr(w, opt).join(' AND ')));
    code.push(nl);
  }

  // ORDER BY
  if (_clauses.orderby) {
    const {exprs, descs} = _clauses.orderby;
    code.push(indent);
    code.push('ORDER BY ');
    code.push(exprs.map((g, i) => genExpr(g, {partition}) + (descs[i] ? ' DESC' : '')).join(','));
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
        code.push(codeGen(q, indentStr, indentLvl + 1, counter));
        code.push(')', nl);
      });
    });

  return code.join('');
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
