import tape from 'tape';
import {base, copy, group, onlyContainClsuses} from './common';
import createColumn from '../../src/utils/create-column';
import {GB_KEY} from '../../src/verbs/groupby';
import {consoleWrapper} from '../utils';
import {op} from 'arquero';

tape('verb: derive', t => {
  const derive = base.derive({f: d => d.a, g: d => d.a + d.b});
  onlyContainClsuses(t, derive, ['select']);
  t.deepEqual(
    derive._clauses.select.slice(0, base.columnNames().length),
    base.columnNames().map(c => createColumn(c)),
    'derive selects original columns',
  );
  t.deepEqual(
    copy(derive._clauses.select.slice(base.columnNames().length)),
    [
      {type: 'Column', name: 'a', as: 'f'},
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '+',
        right: {type: 'Column', name: 'b'},
        as: 'g',
      },
    ],
    'derive correct expressions',
  );
  t.deepEqual(derive._columns, ['a', 'b', 'c', 'd', 'f', 'g'], 'correct schema');

  t.end();
});

tape('verb: derive (overriding column)', t => {
  const derive = base.derive({f: d => d.a + 1, a: d => d.b + 2});
  onlyContainClsuses(t, derive, ['select']);
  t.deepEqual(
    derive._clauses.select.slice(1, base.columnNames().length),
    base
      .columnNames()
      .slice(1)
      .map(c => createColumn(c)),
    'derive selects original columns',
  );
  t.deepEqual(
    copy(derive._clauses.select[0]),
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'b'},
      operator: '+',
      right: {type: 'Literal', value: 2, raw: '2'},
      as: 'a',
    },
    'derive correct overriden column',
  );
  t.deepEqual(
    copy(derive._clauses.select[derive._clauses.select.length - 1]),
    {
      type: 'BinaryExpression',
      left: {type: 'Column', name: 'a'},
      operator: '+',
      right: {type: 'Literal', value: 1, raw: '1'},
      as: 'f',
    },
    'derive correct expressions',
  );
  t.deepEqual(derive._columns, ['a', 'b', 'c', 'd', 'f'], 'correct schema');

  t.end();
});

tape(
  'verb: derive (grouped query)',
  consoleWrapper(
    'warn',
    ['Deriving with group may produce output with different ordering of rows'],
    'warn when derive with group',
    t => {
      const derive = group.derive({f: d => d.a, g: d => d.a + d.b});
      onlyContainClsuses(t, derive, ['select']);
      t.deepEqual(derive._source, group, 'only select from previous query');
      t.deepEqual(
        copy(derive._clauses.select),
        [
          ...base.columnNames().map(c => createColumn(c)),
          {type: 'Column', name: 'a', as: 'f'},
          {
            type: 'BinaryExpression',
            left: {type: 'Column', name: 'a'},
            operator: '+',
            right: {type: 'Column', name: 'b'},
            as: 'g',
          },
          ...group._group.map(c => createColumn(GB_KEY(c))),
        ],
        'derive groupby columns',
      );
      t.deepEqual(derive._columns, ['a', 'b', 'c', 'd', 'f', 'g'], 'correct schema');
      t.deepEqual(derive._group, ['a', 'b'], 'group remains the same');
    },
  ),
);

tape(
  'verb: derive (grouped query with window function)',
  consoleWrapper(
    'warn',
    [
      'Deriving with group may produce output with different ordering of rows',
      'Deriving with window functions with group and without and explicit ordering may produce different result than Arquero',
    ],
    'warn when derive with group',
    () => group.derive({f: () => op.row_number()}),
  ),
);

tape('verb: derive (do not allow window and aggregation function in the same expression)', t => {
  t.throws(() => {
    base.derive({col: d => op.row_number() + op.mean(d)});
  }, 'Cannot derive an expression containing both an aggregation function and a window fundtion');

  t.end();
});
