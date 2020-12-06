import tape from 'tape';
import {createColumn, isFunction, resolveColumns} from '../src/utils';
import {all, internal, not} from 'arquero';

const {Verbs} = internal;
const schema = {
  columns: ['c1', 'c2', 'c3', 'c4', 'c5'],
};

tape('resolveColumns', t => {
  t.deepEqual(
    resolveColumns(schema, [createColumn('c2'), createColumn('c3')]),
    ['c2', 'c3'],
    'should resolve column selection with schema',
  );

  t.deepEqual(
    resolveColumns(schema, [createColumn('c1'), createColumn('c4')]),
    ['c1', 'c4'],
    'should resolve column selection with schema',
  );

  t.deepEqual(
    resolveColumns(null, [createColumn('c1'), createColumn('c4')]),
    ['c1', 'c4'],
    'should resolve column selection without schema',
  );

  t.deepEqual(
    resolveColumns(schema, Verbs.select([not('c1'), 'c2']).toAST().columns),
    ['c2', 'c3', 'c4', 'c5'],
    'should resolve "not" selection with schema',
  );

  t.deepEqual(
    resolveColumns(schema, Verbs.select([not('c1'), 'c1']).toAST().columns),
    ['c2', 'c3', 'c4', 'c5', 'c1'],
    'should resolve "not" selection with schema (select the not selected column)',
  );

  t.equal(
    resolveColumns(null, Verbs.select([not('c1'), 'c2']).toAST().columns),
    null,
    'should not resolve "not" selection with schema',
  );

  t.deepEqual(
    resolveColumns(schema, Verbs.select(all()).toAST().columns),
    ['c1', 'c2', 'c3', 'c4', 'c5'],
    'should resolve "all" selection with schema',
  );

  t.deepEqual(
    resolveColumns(schema, Verbs.select([all(), 'c1']).toAST().columns),
    ['c1', 'c2', 'c3', 'c4', 'c5'],
    'should resolve "all" selection with schema (select additional column)',
  );

  t.equal(
    resolveColumns(null, Verbs.select(all()).toAST().columns),
    null,
    'should not resolve "all" selection with schema',
  );

  t.throws(
    () => {
      resolveColumns(schema, [{type: 'other'}]);
    },
    /Selection should only contains Selection or Column but received.*/,
    'should throw an error when receive a selection that is not Column or Selection',
  );

  t.end();
});

tape('isFunction', t => {
  t.ok(isFunction(() => 5), 'is function');
  t.notOk(isFunction(5), 'is not function');
  t.end();
});

tape('createColumn', t => {
  t.deepEqual(createColumn('col1'), {type: 'Column', name: 'col1'}, 'create column correctly');
  t.end();
});