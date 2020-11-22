export const visit = (node, opt) => {
  return visitors[node.type](node, opt);
};

const visitors = {
  Column: (node, opt) => {
    if (table) throw new Error("table is not supported");
    if (opt && 'index' in opt) throw new Error("row is not supported");
    return node.name;
  },
  Constant: node => {
    throw new Error("TODO: implement Constant visitor: " + JSON.stringify(node));
    // return node.raw;
  },
  Function: node => {
    throw new Error("TODO: implement Function visitor: " + JSON.stringify(node));
    // return `fn.${node.name}`;
  },
  Parameter: node => {
    throw new Error("TODO: implement Parameter visitor: " + JSON.stringify(node));
    // TODO: what is Parameter
    // const param = node.computed
    //   ? `[${JSON.stringify(node.name)}]`
    //   : `.${node.name}`;
    // return `$${param}`;
  },
  OpLookup: (node, opt) => {
    throw new Error("TODO: implement OpLookup visitor: " + JSON.stringify(node));
    // TODO: match arquero's ops to sql ops
    // const d = !node.computed;
    // const o = (opt.op || node.object.name) + (node.index || '');
    // const p = visit(node.property, opt);
    // return o + (d ? '.' + p : '[' + p + ']');
  },
  Literal: node => node.raw,
  Identifier: node => node.name,
  TemplateLiteral: (node, opt) => {
    const { quasis, expressions } = node;
    const n = expressions.length;
    let t = '"' + quasis[0].value.raw + '"';
    for (let i = 0; i < n;) {
      t += ', ' + visit(expressions[i], opt) + ', "' + quasis[++i].value.raw + '"';
    }
    return 'CONCAT(' + t + ')';
  },
  MemberExpression: (node, opt) => {
    const d = !node.computed;
    const o = visit(node.object, opt);
    const p = visit(node.property, opt);
    return o + (d ? '.' + p : '[' + p + ']');
  },
  CallExpression: call,
  NewExpression: (node, opt) => {
    return 'new ' + call(node, opt);
  },
  ArrayExpression: (node, opt) => {
    return '[' + list(node.elements, opt) + ']';
  },
  AssignmentExpression: binary,
  BinaryExpression: binary,
  LogicalExpression: binary,
  UnaryExpression: (node, opt) => {
    return '(' + node.operator + visit(node.argument, opt) + ')';
  },
  ConditionalExpression: (node, opt) => {
    return '(' + visit(node.test, opt) +
      '?' + visit(node.consequent, opt) +
      ':' + visit(node.alternate, opt) + ')';
  },
  ObjectExpression: (node, opt) => {
    return '({' + list(node.properties, opt) + '})';
  },
  Property: (node, opt) => {
    return visit(node.key, opt) + ':' + visit(node.value, opt);
  },

  ArrowFunctionExpression: func,
  FunctionExpression: func,
  FunctionDeclaration: func,

  ArrayPattern: (node, opt) => {
    return '[' + list(node.elements, opt) + ']';
  },
  ObjectPattern: (node, opt) => {
    return '{' + list(node.properties, opt) + '}';
  },
  VariableDeclaration: (node, opt) => {
    return node.kind + ' ' + list(node.declarations, opt, ',');
  },
  VariableDeclarator: (node, opt) => {
    return visit(node.id, opt) + '=' + visit(node.init, opt);
  },
  SpreadElement: (node, opt) => {
    return '...' + visit(node.argument, opt);
  },

  BlockStatement: (node, opt) => {
    return '{' + list(node.body, opt, ';') + ';}';
  },
  BreakStatement: () => {
    return 'break';
  },
  ExpressionStatement: (node, opt) => {
    return visit(node.expression, opt);
  },
  IfStatement: (node, opt) => {
    return 'if (' + visit(node.test, opt) + ')'
      + visit(node.consequent, opt)
      + (node.alternate ? ' else ' + visit(node.alternate, opt) : '');
  },
  SwitchStatement: (node, opt) => {
    return 'switch (' + visit(node.discriminant, opt) + ') {'
     + list(node.cases, opt, '')
     + '}';
  },
  SwitchCase: (node, opt) => {
    return (node.test ? 'case ' + visit(node.test, opt) : 'default')
      + ': '
      + list(node.consequent, opt, ';') + ';';
  },
  ReturnStatement: (node, opt) => {
    return 'return ' + visit(node.argument, opt);
  },
  Program: (node, opt) => visit(node.body[0], opt)
};