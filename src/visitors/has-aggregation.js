export const hasAggregation = node => {
  return visitors[node.type](node);
};

const binary = node => {
  return hasAggregation(node.left) || hasAggregation(node.right);
};

const call = node => {
  return hasAggregation(node.callee) || list(node.arguments);
};

const list = array => {
  return array.some(node => hasAggregation(node));
};

const AGGREGATED_OPS = ['mean'];

const visitors = {
  Column: () => false,
  Constant: node => {
    throw new Error('TODO: implement Constant visitor: ' + JSON.stringify(node));
  },
  Function: node => AGGREGATED_OPS.includes(node.name),
  Parameter: node => {
    throw new Error('Parameter is not supported: ' + JSON.stringify(node));
  },
  OpLookup: node => {
    throw new Error('OpLookup is not supported: ' + JSON.stringify(node));
  },
  Literal: node => false,
  Identifier: node => false,
  TemplateLiteral: node => node.expressions.some(e => hasAggregation(e)),
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
  UnaryExpression: node => hasAggregation(node.argument),
  ConditionalExpression: node =>
    hasAggregation(node.test) || hasAggregation(node.consequent) || hasAggregation(node.alternate),
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
  ExpressionStatement: node => hasAggregation(node.expression),
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
