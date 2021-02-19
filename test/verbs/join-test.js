import tape from 'tape';
import createColumn from '../../src/utils/create-column';
import {base, base3, copy, onlyContainClsuses} from './common';
import {JOIN_TYPES} from '../../src/verbs/join';

tape('verb: join', t => {
  JOIN_TYPES.forEach((joinType, idx) => {
    const join = base.join(base3, 'a', null, {left: idx >> 1, right: idx % 2});
    onlyContainClsuses(t, join, ['select', 'join']);
    t.equal(join._source, base, 'join wraps around the previous query');
    t.equal(join._clauses.join.other, base3, 'other table is in join clause');

    const join_col = table => [createColumn('a', 'a', table)];
    t.deepEqual(
      copy(join._clauses.select),
      [
        ...(joinType === 'OUTER'
          ? [
              {
                type: 'ConditionalExpression',
                test: {
                  type: 'BinaryExpression',
                  left: {type: 'Column', name: 'a', table: 1},
                  operator: '==',
                  right: {type: 'Literal', value: null, raw: 'null'},
                },
                consequent: {type: 'Column', name: 'a', table: 2},
                alternate: {type: 'Column', name: 'a', table: 1},
                as: 'a',
              },
            ]
          : []),
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
  });

  t.end();
});
