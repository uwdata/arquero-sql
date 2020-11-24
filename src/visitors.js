export const visit = (node, opt, tables) => {
  return visitors[node.type](node, opt, tables);
};

const binary = (node, opt, tables) => {
  return '(' + visit(node.left, opt, tables) + node.operator + visit(node.right, opt, tables) + ')';
};

const func = (node, opt, tables) => {
  return '(' + list(node.params, opt, tables) + ')=>' + visit(node.body, opt, tables);
};

const call = (node, opt, tables) => {
  return visit(node.callee, opt, tables) + '(' + list(node.arguments, opt, tables) + ')';
};

const list = (array, opt, tables, delim=',') => {
  return array.map(node => visit(node, opt, tables)).join(delim);
};

const visitors = {
  Column: (node, opt, tables) => {
    if (opt && 'index' in opt) throw new Error("row is not supported");
    return `${node.table ? (tables[node.table] + '.') : ''}${node.name}`;
  },
  Constant: node => {
    throw new Error("TODO: implement Constant visitor: " + JSON.stringify(node));
    // return node.raw;
  },
  Function: node => {
    // throw new Error("TODO: implement Function visitor: " + JSON.stringify(node));
    const {name} = node;
    switch (name) {
      case 'row_number': return 'ROW_NUMBER';
    }
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
    throw new Error("TODO: implement MemberExpression visitor: " + JSON.stringify(node));
    // const d = !node.computed;
    // const o = visit(node.object, opt);
    // const p = visit(node.property, opt);
    // return o + (d ? '.' + p : '[' + p + ']');
  },
  CallExpression: call,
  NewExpression: node => {
    throw new Error("NewExpression is not supported: " + JSON.stringify(node));
  },
  ArrayExpression: (node, opt) => {
    throw new Error("ArrayExpression is not supported: " + JSON.stringify(node));
    // return '[' + list(node.elements, opt) + ']';
  },
  AssignmentExpression: node => {
    throw new Error("AssignmentExpression is not supported: " + JSON.stringify(node));
  },
  BinaryExpression: binary,
  LogicalExpression: binary,
  UnaryExpression: (node, opt) => {
    return '(' + node.operator + visit(node.argument, opt) + ')';
  },
  ConditionalExpression: (node, opt) => {
    return 'IF(' + visit(node.test, opt) +
      ',' + visit(node.consequent, opt) +
      ',' + visit(node.alternate, opt) + ')';
  },
  ObjectExpression: (node, opt) => {
    throw new Error("ObjectExpression is not supported: " + JSON.stringify(node));
    // return '({' + list(node.properties, opt) + '})';
  },
  Property: (node, opt) => {
    throw new Error("Property is not supported: " + JSON.stringify(node));
    // return visit(node.key, opt) + ':' + visit(node.value, opt);
  },

  ArrowFunctionExpression: (node, opt) => {
    throw new Error("TODO: implement ArrowFunctionExpression visitor: " + JSON.stringify(node));
    // return func(node, opt);
  },
  FunctionExpression: (node, opt) => {
    throw new Error("TODO: implement FunctionExpression visitor: " + JSON.stringify(node));
    // return func(node, opt);
  },
  FunctionDeclaration: (node, opt) => {
    throw new Error("TODO: implement FunctionDeclaration visitor: " + JSON.stringify(node));
    // return func(node, opt);
  },

  ArrayPattern: (node, opt) => {
    throw new Error("ArrayPattern is not supported: " + JSON.stringify(node));
    // return '[' + list(node.elements, opt) + ']';
  },
  ObjectPattern: (node, opt) => {
    throw new Error("ObjectPattern is not supported: " + JSON.stringify(node));
    // return '{' + list(node.properties, opt) + '}';
  },
  VariableDeclaration: (node, opt) => {
    throw new Error("VariableDeclaration is not supported: " + JSON.stringify(node));
    // return node.kind + ' ' + list(node.declarations, opt, ',');
  },
  VariableDeclarator: (node, opt) => {
    throw new Error("VariableDeclarator is not supported: " + JSON.stringify(node));
    // return visit(node.id, opt) + '=' + visit(node.init, opt);
  },
  SpreadElement: (node, opt) => {
    throw new Error("SpreadElement is not supported: " + JSON.stringify(node));
    // return '...' + visit(node.argument, opt);
  },

  BlockStatement: (node, opt) => {
    throw new Error("BlockStatement is not supported: " + JSON.stringify(node));
    // return '{' + list(node.body, opt, ';') + ';}';
  },
  BreakStatement: () => {
    throw new Error("BreakStatement is not supported: " + JSON.stringify(node));
    // return 'break';
  },
  ExpressionStatement: (node, opt) => {
    return visit(node.expression, opt);
  },
  IfStatement: (node, opt) => {
    throw new Error("IfStatement is not supported: " + JSON.stringify(node));
    // return 'if (' + visit(node.test, opt) + ')'
    //   + visit(node.consequent, opt)
    //   + (node.alternate ? ' else ' + visit(node.alternate, opt) : '');
  },
  SwitchStatement: (node, opt) => {
    throw new Error("SwitchStatement is not supported: " + JSON.stringify(node));
    // return 'switch (' + visit(node.discriminant, opt) + ') {'
    //  + list(node.cases, opt, '')
    //  + '}';
  },
  SwitchCase: (node, opt) => {
    throw new Error("SwitchCase is not supported: " + JSON.stringify(node));
    // return (node.test ? 'case ' + visit(node.test, opt) : 'default')
    //   + ': '
    //   + list(node.consequent, opt, ';') + ';';
  },
  ReturnStatement: (node, opt) => {
    throw new Error("ReturnStatement is not supported: " + JSON.stringify(node));
    // return 'return ' + visit(node.argument, opt);
  },
  Program: (node, opt) => {
    throw new Error("Program is not supported: " + JSON.stringify(node));
    // return visit(node.body[0], opt)
  }
};