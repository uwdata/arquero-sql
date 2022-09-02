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

export const genExpr = (node, opt, tables) => {
  return visitors[node.type](node, opt, tables);
};

const binary = (node, opt, tables) => {
  if (node.operator === '%') {
    return 'MOD(' + genExpr(node.left, opt, tables) + ',' + genExpr(node.right, opt, tables) + ')';
  }
  return (
    '(' +
    genExpr(node.left, opt, tables) +
    (BINARY_OPS[node.operator] || node.operator) +
    genExpr(node.right, opt, tables) +
    ')'
  );
};

const call = (node, opt, tables) => {
  const over = [];
  if (
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
  const callee = genExpr(node.callee, opt, tables);
  const args = list(node.arguments, opt, tables);
  return `(${callee}(${args})${over.join('')})`;
};

const list = (array, opt, tables, delim = ',') => {
  return array.map(node => genExpr(node, opt, tables)).join(delim);
};

const visitors = {
  Column: (node, opt, tables) => {
    if (opt && 'index' in opt) throw new Error('row is not supported');
    return `${node.table && tables ? tables[node.table] + '.' : ''}${node.name}`;
  },
  Constant: node => {
    throw new Error('TODO: implement Constant visitor: ' + JSON.stringify(node));
    // return node.raw;
  },
  Function: node => ARQUERO_OPS_TO_SQL[node.name],
  Parameter: node => {
    throw new Error('Parameter is not supported: ' + JSON.stringify(node));
  },
  OpLookup: node => {
    throw new Error('OpLookup is not supported: ' + JSON.stringify(node));
  },
  Literal: node => node.raw,
  Identifier: node => node.name,
  TemplateLiteral: (node, opt, tables) => {
    const {quasis, expressions} = node;
    const n = expressions.length;
    let t = '"' + quasis[0].value.raw + '"';
    for (let i = 0; i < n; ) {
      t += ', ' + genExpr(expressions[i], opt, tables) + ', "' + quasis[++i].value.raw + '"';
    }
    return 'CONCAT(' + t + ')';
  },
  MemberExpression: node => {
    throw new Error('MemberExpression is not supported: ' + JSON.stringify(node));
  },
  CallExpression: call,
  NewExpression: node => {
    throw new Error('NewExpression is not supported: ' + JSON.stringify(node));
  },
  ArrayExpression: node => {
    throw new Error('ArrayExpression is not supported: ' + JSON.stringify(node));
  },
  AssignmentExpression: node => {
    throw new Error('AssignmentExpression is not supported: ' + JSON.stringify(node));
  },
  BinaryExpression: binary,
  LogicalExpression: binary,
  UnaryExpression: (node, opt, tables) => {
    return '(' + node.operator + genExpr(node.argument, opt, tables) + ')';
  },
  ConditionalExpression: (node, opt, tables) => {
    return (
      'IF(' +
      genExpr(node.test, opt, tables) +
      ',' +
      genExpr(node.consequent, opt, tables) +
      ',' +
      genExpr(node.alternate, opt, tables) +
      ')'
    );
  },
  ObjectExpression: node => {
    throw new Error('ObjectExpression is not supported: ' + JSON.stringify(node));
  },
  Property: node => {
    throw new Error('Property is not supported: ' + JSON.stringify(node));
  },

  ArrowFunctionExpression: node => {
    throw new Error('ArrowFunctionExpression is not supported: ' + JSON.stringify(node));
  },
  FunctionExpression: node => {
    throw new Error('FunctionExpression is not supported: ' + JSON.stringify(node));
  },
  FunctionDeclaration: node => {
    throw new Error('FunctionDeclaration is not supported: ' + JSON.stringify(node));
  },

  ArrayPattern: node => {
    throw new Error('ArrayPattern is not supported: ' + JSON.stringify(node));
  },
  ObjectPattern: node => {
    throw new Error('ObjectPattern is not supported: ' + JSON.stringify(node));
  },
  VariableDeclaration: node => {
    throw new Error('VariableDeclaration is not supported: ' + JSON.stringify(node));
  },
  VariableDeclarator: node => {
    throw new Error('VariableDeclarator is not supported: ' + JSON.stringify(node));
  },
  SpreadElement: node => {
    throw new Error('SpreadElement is not supported: ' + JSON.stringify(node));
  },

  BlockStatement: node => {
    throw new Error('BlockStatement is not supported: ' + JSON.stringify(node));
  },
  BreakStatement: node => {
    throw new Error('BreakStatement is not supported: ' + JSON.stringify(node));
  },
  ExpressionStatement: (node, opt, tables) => {
    return genExpr(node.expression, opt, tables);
  },
  IfStatement: node => {
    throw new Error('IfStatement is not supported: ' + JSON.stringify(node));
  },
  SwitchStatement: node => {
    throw new Error('SwitchStatement is not supported: ' + JSON.stringify(node));
  },
  SwitchCase: node => {
    throw new Error('SwitchCase is not supported: ' + JSON.stringify(node));
  },
  ReturnStatement: node => {
    throw new Error('ReturnStatement is not supported: ' + JSON.stringify(node));
  },
  Program: node => {
    throw new Error('Program is not supported: ' + JSON.stringify(node));
  },
};
