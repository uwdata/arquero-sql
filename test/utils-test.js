import tape from 'tape';
import createColumn from '../src/utils/create-column';

tape('createColumn', t => {
  t.deepEqual(createColumn('col1'), {type: 'Column', name: 'col1'}, 'create column correctly');
  t.deepEqual(
    createColumn('col1', 'col2'),
    {type: 'Column', name: 'col1', as: 'col2'},
    'create column with new output name correctly',
  );
  t.end();
});
