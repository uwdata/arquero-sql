import error from 'arquero/src/util/error';

/**
 *
 * @param {*} node
 * @param {string[]} fns
 */
export default function hasFunction(node, fns) {
  return visitors[node.type](node, fns);
}

const binary = (node, fns) => {
  return hasFunction(node.left, fns) || hasFunction(node.right, fns);
};

const call = (node, fns) => {
  return hasFunction(node.callee, fns) || list(node.arguments, fns);
};

const list = (array, fns) => {
  return array.some(node => hasFunction(node, fns));
};

const unsuported = node => error(node.type + ' is not supported: ' + JSON.stringify(node));

const visitors = {
  Column: () => false,
  Constant: () => false,
  Function: (node, fns) => fns.includes(node.name),
  Parameter: unsuported,
  OpLookup: unsuported,
  Literal: () => false,
  Identifier: () => false,
  TemplateLiteral: (node, fns) => node.expressions.some(e => hasFunction(e, fns)),
  MemberExpression: unsuported,
  CallExpression: call,
  NewExpression: unsuported,
  ArrayExpression: unsuported,
  AssignmentExpression: unsuported,
  BinaryExpression: binary,
  LogicalExpression: binary,
  UnaryExpression: (node, fns) => hasFunction(node.argument, fns),
  ConditionalExpression: (node, fns) =>
    hasFunction(node.test, fns) || hasFunction(node.consequent, fns) || hasFunction(node.alternate, fns),
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
  ExpressionStatement: (node, fns) => hasFunction(node.expression, fns),
  IfStatement: unsuported,
  SwitchStatement: unsuported,
  SwitchCase: unsuported,
  ReturnStatement: unsuported,
  Program: unsuported,
};
