import error from 'arquero/src/util/error';

export const ARQUERO_AGGREGATION_FN = ['mean', 'max'];
export const ARQUERO_WINDOW_FN = ['row_number'];
export const ARQUERO_FN = ['random'];

const ARQUERO_OPS_TO_SQL = {
  row_number: 'ROW_NUMBER',
  mean: 'AVG',
  max: 'MAX',
  random: 'RANDOM',
};

const BINARY_OPS = {
  '===': '=',
  '==': '=',
  '!==': '<>',
  '!=': '<>',
};

/**
 *
 * @param {*} node
 * @param {GenExprOpt} opt
 */
export function genExpr(node, opt) {
  return visitors[node.type](node, opt);
}

const binary = (node, opt) => {
  if (node.operator === '%') {
    return 'MOD(' + genExpr(node.left, opt) + ',' + genExpr(node.right, opt) + ')';
  }
  return '(' + genExpr(node.left, opt) + (BINARY_OPS[node.operator] || node.operator) + genExpr(node.right, opt) + ')';
};

const call = (node, opt) => {
  if (node.callee.type === 'Function') {
    const _args = node.arguments.map(a => genExpr(a, opt));
    switch (node.callee.name) {
      case 'equal':
        if (_args[0] === 'null') {
          return `(${_args[1]} IS NULL)`;
        } else if (_args[1] === 'null') {
          return `(${_args[0]} IS NULL)`;
        }
    }
  }

  const over = [];
  if (
    !opt.withoutOver &&
    node.callee.type === 'Function' &&
    [ARQUERO_AGGREGATION_FN, ARQUERO_WINDOW_FN].some(fn => fn.includes(node.callee.name))
  ) {
    over.push(' OVER (');
    const toOrder = opt.order && ARQUERO_WINDOW_FN.includes(node.callee.name);
    if (opt.partition) {
      over.push('PARTITION BY ', opt.partition);
      if (toOrder) {
        over.push(' ');
      }
    }
    if (toOrder) {
      over.push('ORDER BY ', opt.order);
    }
    over.push(')');
  }
  const callee = genExpr(node.callee, opt);
  const args = list(node.arguments, opt);
  return `(${callee}(${args})${over.join('')})`;
};

const list = (array, opt, delim = ',') => {
  return array.map(node => genExpr(node, opt)).join(delim);
};

const unsuported = node => error(node.type + ' is not supported: ' + JSON.stringify(node));

const visitors = {
  Column: (node, opt) => {
    if (opt && 'index' in opt) throw new Error('row is not supported');
    return `${node.table && opt.tables ? opt.tables[node.table - 1] + '.' : ''}${node.name}`;
  },
  Constant: node => node.raw,
  Function: node => ARQUERO_OPS_TO_SQL[node.name],
  Parameter: unsuported,
  OpLookup: unsuported,
  Literal: node => node.raw,
  Identifier: node => node.name,
  TemplateLiteral: (node, opt) => {
    const {quasis, expressions} = node;
    const n = expressions.length;
    let t = '"' + quasis[0].value.raw + '"';
    for (let i = 0; i < n; ) {
      t += ', ' + genExpr(expressions[i], opt) + ', "' + quasis[++i].value.raw + '"';
    }
    return 'CONCAT(' + t + ')';
  },
  MemberExpression: unsuported,
  CallExpression: call,
  NewExpression: unsuported,
  ArrayExpression: unsuported,
  AssignmentExpression: unsuported,
  BinaryExpression: binary,
  LogicalExpression: binary,
  UnaryExpression: (node, opt) => {
    return '(' + node.operator + genExpr(node.argument, opt) + ')';
  },
  ConditionalExpression: (node, opt) => {
    return (
      '(CASE WHEN ' +
      genExpr(node.test, opt) +
      ' THEN ' +
      genExpr(node.consequent, opt) +
      ' ELSE ' +
      genExpr(node.alternate, opt) +
      ' END)'
    );
  },
  ObjectExpression: unsuported,
  Property: unsuported,

  ArrowFunctionExpression: unsuported,
  FunctionExpression: unsuported,
  FunctionDeclaration: unsuported,

  ArrayPattern: unsuported,
  ObjectPattern: unsuported,
  VariableDeclaration: unsuported,
  VariableDeclarator: unsuported,
  SpreadElement: unsuported,

  BlockStatement: unsuported,
  BreakStatement: unsuported,
  ExpressionStatement: (node, opt) => {
    return genExpr(node.expression, opt);
  },
  IfStatement: unsuported,
  SwitchStatement: unsuported,
  SwitchCase: unsuported,
  ReturnStatement: unsuported,
  Program: unsuported,
};

/**
 * @typedef {object} GenExprOpt
 * @prop {string} [partition]
 * @prop {string} [order]
 * @prop {string[]} [tables]
 * @prop {boolean} [withoutOver]
 */
