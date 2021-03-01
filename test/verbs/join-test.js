import tape from 'tape';
import createColumn from '../../src/utils/create-column';
import {base, base3, copy, onlyContainClsuses} from './common';
import {JOIN_TYPES} from '../../src/verbs/join';
import {not} from 'arquero';

/**
 *
 * @param {number} table
 * @param {string} name
 */
function columnIfNotNull(table, name) {
  return {
    type: 'ConditionalExpression',
    test: {
      type: 'CallExpression',
      callee: {type: 'Function', name: 'equal'},
      arguments: [
        createColumn(name, name, table),
        {type: 'Literal', value: null, raw: 'null'},
      ],
    },
    consequent: createColumn(name, name, 3 - table),
    alternate: createColumn(name, name, table),
    as: name,
  };
}

JOIN_TYPES.forEach((joinType, idx) => {
  const option = {left: idx >> 1, right: idx % 2};

  tape('verb: join ' + joinType.toLowerCase(), t => {
    const join = base.join(base3, 'a', null, option);
    onlyContainClsuses(t, join, ['select', 'join']);
    t.equal(join._source, base, 'join wraps around the previous query');
    t.equal(join._clauses.join.other, base3, 'other table is in join clause');

    const join_col = table => [createColumn('a', 'a', table)];
    t.deepEqual(
      copy(join._clauses.select),
      [
        ...(joinType === 'FULL' ? [columnIfNotNull(1, 'a')] : []),
        ...(joinType === 'INNER' || joinType === 'LEFT' ? join_col(1) : []),
        createColumn('b', 'b_1', 1),
        createColumn('c', 'c_1', 1),
        createColumn('d', 'd', 1),
        ...(joinType === 'RIGHT' ? join_col(2) : []),
        createColumn('b', 'b_2', 2),
        createColumn('c', 'c_2', 2),
        createColumn('e', 'e', 2),
      ],
      "select both tables' columns with suffixes",
    );
    t.deepEqual(
      copy(join._clauses.join.on),
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a', table: 1},
        operator: '===',
        right: {type: 'Column', name: 'a', table: 2},
      },
      'correct join expression',
    );
    t.equal(join._clauses.join.join_type, joinType, 'correct join type');

    t.end();
  });

  tape('verb: join ' + joinType.toLowerCase() + ' (with join expression)', t => {
    const join = base.join(base3, (a, b) => a.a === b.b + b.c, null, option);

    t.deepEqual(
      copy(join._clauses.select),
      [
        createColumn('a', 'a_1', 1),
        createColumn('b', 'b_1', 1),
        createColumn('c', 'c_1', 1),
        createColumn('d', 'd', 1),
        createColumn('a', 'a_2', 2),
        createColumn('b', 'b_2', 2),
        createColumn('c', 'c_2', 2),
        createColumn('e', 'e', 2),
      ],
      "select both tables' columns with suffixes",
    );
    t.deepEqual(
      copy(join._clauses.join.on),
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a', table: 1},
        operator: '===',
        right: {
          type: 'BinaryExpression',
          left: {type: 'Column', name: 'b', table: 2},
          operator: '+',
          right: {type: 'Column', name: 'c', table: 2},
        },
      },
      'correct join expression',
    );

    t.end();
  });

  tape('verb: join ' + joinType.toLowerCase() + ' (with all columns)', t => {
    const join = base.join(base3, null, null, option);

    const commonColumns = table => [
      createColumn('a', 'a', table),
      createColumn('b', 'b', table),
      createColumn('c', 'c', table),
    ];

    const outerColumns = [
      columnIfNotNull(1, 'a'),
      columnIfNotNull(1, 'b'),
      columnIfNotNull(1, 'c'),
      createColumn('d', 'd', 1),
      createColumn('e', 'e', 2),
    ];
    const nonOuterColumns = [
      ...(joinType !== 'RIGHT' ? commonColumns(1) : []),
      createColumn('d', 'd', 1),
      ...(joinType === 'RIGHT' ? commonColumns(2) : []),
      createColumn('e', 'e', 2),
    ];

    t.deepEqual(
      copy(join._clauses.select),
      joinType === 'FULL' ? outerColumns : nonOuterColumns,
      "select both tables' columns with suffixes",
    );
    t.deepEqual(
      copy(join._clauses.join.on),
      {
        type: 'LogicalExpression',
        left: {
          type: 'LogicalExpression',
          left: {
            type: 'BinaryExpression',
            left: {type: 'Column', name: 'a', table: 1},
            operator: '===',
            right: {type: 'Column', name: 'a', table: 2},
          },
          operator: '&&',
          right: {
            type: 'BinaryExpression',
            left: {type: 'Column', name: 'b', table: 1},
            operator: '===',
            right: {type: 'Column', name: 'b', table: 2},
          },
        },
        operator: '&&',
        right: {
          type: 'BinaryExpression',
          left: {type: 'Column', name: 'c', table: 1},
          operator: '===',
          right: {type: 'Column', name: 'c', table: 2},
        },
      },
      'correct join expression',
    );

    t.end();
  });

  tape('verb: join ' + joinType.toLowerCase() + ' with custom values', t => {
    const join = base.join(base3, 'a', [not('c'), ['e', 'b', 'b', 'e']], option);

    t.deepEqual(
      copy(join._clauses.select),
      [
        {type: 'Column', name: 'a', table: 1},
        {type: 'Column', name: 'b', table: 1, as: 'b_1'},
        {type: 'Column', name: 'd', table: 1},
        {type: 'Column', name: 'e', table: 2},
        {type: 'Column', name: 'b', table: 2, as: 'b_2'},
      ],
      "select both tables' columns with suffixes",
    );
    t.deepEqual(
      copy(join._clauses.join.on),
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a', table: 1},
        operator: '===',
        right: {type: 'Column', name: 'a', table: 2},
      },
      'correct join expression',
    );

    t.end();
  });
});
