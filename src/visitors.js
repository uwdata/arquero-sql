export const visit = (node, opt, tables) => {
  return visitors[node.type](node, opt, tables);
};

const binary = (node, opt, tables) => {
  return (
    "(" +
    visit(node.left, opt, tables) +
    node.operator +
    visit(node.right, opt, tables) +
    ")"
  );
};

const call = (node, opt, tables) => {
  return (
    visit(node.callee, opt, tables) +
    "(" +
    list(node.arguments, opt, tables) +
    ")"
  );
};

const list = (array, opt, tables, delim = ",") => {
  return array.map((node) => visit(node, opt, tables)).join(delim);
};

const visitors = {
  Column: (node, opt, tables) => {
    if (opt && "index" in opt) throw new Error("row is not supported");
    return `${node.table && tables ? tables[node.table] + "." : ""}${
      node.name
    }`;
  },
  Constant: (node) => {
    throw new Error(
      "TODO: implement Constant visitor: " + JSON.stringify(node)
    );
    // return node.raw;
  },
  Function: (node) => {
    switch (node.name) {
      case "row_number":
        return "ROW_NUMBER";
      case "mean":
        return "AVG";
    }
  },
  Parameter: (node) => {
    throw new Error("Parameter is not supported: " + JSON.stringify(node));
  },
  OpLookup: (node) => {
    throw new Error("OpLookup is not supported: " + JSON.stringify(node));
  },
  Literal: (node) => node.raw,
  Identifier: (node) => node.name,
  TemplateLiteral: (node, opt, tables) => {
    const { quasis, expressions } = node;
    const n = expressions.length;
    let t = '"' + quasis[0].value.raw + '"';
    for (let i = 0; i < n; ) {
      t +=
        ", " +
        visit(expressions[i], opt, tables) +
        ', "' +
        quasis[++i].value.raw +
        '"';
    }
    return "CONCAT(" + t + ")";
  },
  MemberExpression: (node) => {
    throw new Error(
      "MemberExpression is not supported: " + JSON.stringify(node)
    );
  },
  CallExpression: call,
  NewExpression: (node) => {
    throw new Error("NewExpression is not supported: " + JSON.stringify(node));
  },
  ArrayExpression: (node) => {
    throw new Error(
      "ArrayExpression is not supported: " + JSON.stringify(node)
    );
  },
  AssignmentExpression: (node) => {
    throw new Error(
      "AssignmentExpression is not supported: " + JSON.stringify(node)
    );
  },
  BinaryExpression: binary,
  LogicalExpression: binary,
  UnaryExpression: (node, opt, tables) => {
    return "(" + node.operator + visit(node.argument, opt, tables) + ")";
  },
  ConditionalExpression: (node, opt, tables) => {
    return (
      "IF(" +
      visit(node.test, opt, tables) +
      "," +
      visit(node.consequent, opt, tables) +
      "," +
      visit(node.alternate, opt, tables) +
      ")"
    );
  },
  ObjectExpression: (node) => {
    throw new Error(
      "ObjectExpression is not supported: " + JSON.stringify(node)
    );
  },
  Property: (node) => {
    throw new Error("Property is not supported: " + JSON.stringify(node));
  },

  ArrowFunctionExpression: (node) => {
    throw new Error(
      "ArrowFunctionExpression is not supported: " + JSON.stringify(node)
    );
  },
  FunctionExpression: (node) => {
    throw new Error(
      "FunctionExpression is not supported: " + JSON.stringify(node)
    );
  },
  FunctionDeclaration: (node) => {
    throw new Error(
      "FunctionDeclaration is not supported: " + JSON.stringify(node)
    );
  },

  ArrayPattern: (node) => {
    throw new Error("ArrayPattern is not supported: " + JSON.stringify(node));
  },
  ObjectPattern: (node) => {
    throw new Error("ObjectPattern is not supported: " + JSON.stringify(node));
  },
  VariableDeclaration: (node) => {
    throw new Error(
      "VariableDeclaration is not supported: " + JSON.stringify(node)
    );
  },
  VariableDeclarator: (node) => {
    throw new Error(
      "VariableDeclarator is not supported: " + JSON.stringify(node)
    );
  },
  SpreadElement: (node) => {
    throw new Error("SpreadElement is not supported: " + JSON.stringify(node));
  },

  BlockStatement: (node) => {
    throw new Error("BlockStatement is not supported: " + JSON.stringify(node));
  },
  BreakStatement: (node) => {
    throw new Error("BreakStatement is not supported: " + JSON.stringify(node));
  },
  ExpressionStatement: (node, opt) => {
    return visit(node.expression, opt, tables);
  },
  IfStatement: (node) => {
    throw new Error("IfStatement is not supported: " + JSON.stringify(node));
  },
  SwitchStatement: (node) => {
    throw new Error(
      "SwitchStatement is not supported: " + JSON.stringify(node)
    );
  },
  SwitchCase: (node) => {
    throw new Error("SwitchCase is not supported: " + JSON.stringify(node));
  },
  ReturnStatement: (node) => {
    throw new Error(
      "ReturnStatement is not supported: " + JSON.stringify(node)
    );
  },
  Program: (node) => {
    throw new Error("Program is not supported: " + JSON.stringify(node));
  },
};
