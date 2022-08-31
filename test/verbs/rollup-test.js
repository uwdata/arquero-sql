import {op} from 'arquero';
import tape from '../tape-wrapper';
import createColumn from '../../src/databases/postgres/utils/create-column';
import {GB_KEY} from '../../src/databases/postgres/verbs/groupby';
import {base, copy, group, onlyContainClsuses} from './common';

tape('verb: rollup', t => {
  const rollup = group.rollup({k: d => op.mean(d.a)});
  onlyContainClsuses(t, rollup, ['select', 'groupby']);
  t.deepEqual(rollup._source, group, 'rollup wraps around the previous query');
  t.deepEqual(
    copy(rollup._clauses.select),
    [
      ...group._group.map(c => createColumn(GB_KEY(c), c)),
      {
        type: 'CallExpression',
        callee: {type: 'Function', name: 'mean'},
        arguments: [{type: 'Column', name: 'a'}],
        as: 'k',
      },
    ],
    'rollup selects groupby keys and rollup expressions',
  );
  t.deepEqual(rollup._columns, [...group._group, 'k'], 'correct schema');
  t.equal(rollup._group, null, 'query is no longer grouped');

  t.end();
});

tape('verb: rollup without groupby', t => {
  const rollup = base.rollup({k: d => op.mean(d.a)});
  onlyContainClsuses(t, rollup, ['select', 'groupby']);
  t.deepEqual(rollup._source, base, 'rollup wraps around the previous query');
  t.deepEqual(
    copy(rollup._clauses.select),
    [
      {
        type: 'CallExpression',
        callee: {type: 'Function', name: 'mean'},
        arguments: [{type: 'Column', name: 'a'}],
        as: 'k',
      },
    ],
    'rollup selects groupby keys and rollup expressions',
  );
  t.equal(rollup._clauses.groupby, true, 'group all into 1 row');
  t.deepEqual(rollup._columns, ['k'], 'correct schema');

  t.end();
});

tape('verb: rollup (do not allow window function)', t => {
  t.throws(() => {
    base.rollup({col: () => op.row_number()});
  }, 'Cannot rollup an expression containing a window fundtion');

  t.end();
});
