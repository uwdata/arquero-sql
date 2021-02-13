import {not} from 'arquero';
import tape from 'tape';
import {base, copy} from './common';

tape('SqlQuery: dedupe', t => {
  const dedupe1 = base.dedupe('a', not('a'), {f: d => d.a, g: d => d.a + d.b});

  t.deepEqual(
    copy(dedupe1),
    {
      _params: {},
      _source: {
        _params: {},
        _source: {
          _params: {},
          _source: {
            _params: {},
            _source: {
              _params: {},
              _source: base,
              _columns: ['a', 'b', 'c', 'd'],
              _clauses: {
                select: [
                  {type: 'Column', name: 'a'},
                  {type: 'Column', name: 'b'},
                  {type: 'Column', name: 'c'},
                  {type: 'Column', name: 'd'},
                  {type: 'Column', name: 'a', as: '___arquero_sql_group_a___'},
                  {type: 'Column', name: 'b', as: '___arquero_sql_group_b___'},
                  {type: 'Column', name: 'c', as: '___arquero_sql_group_c___'},
                  {type: 'Column', name: 'd', as: '___arquero_sql_group_d___'},
                  {type: 'Column', name: 'a', as: '___arquero_sql_group_f___'},
                  {
                    type: 'BinaryExpression',
                    left: {type: 'Column', name: 'a'},
                    operator: '+',
                    right: {type: 'Column', name: 'b'},
                    as: '___arquero_sql_group_g___',
                  },
                ],
              },
              _group: ['a', 'b', 'c', 'd', 'f', 'g'],
            },
            _columns: ['a', 'b', 'c', 'd', '___arquero_sql_predicate___'],
            _clauses: {
              select: [
                {type: 'Column', name: 'a'},
                {type: 'Column', name: 'b'},
                {type: 'Column', name: 'c'},
                {type: 'Column', name: 'd'},
                {
                  type: 'BinaryExpression',
                  left: {type: 'CallExpression', callee: {type: 'Function', name: 'row_number'}, arguments: []},
                  operator: '===',
                  right: {type: 'Literal', value: 1, raw: '1'},
                  as: '___arquero_sql_predicate___',
                },
                {type: 'Column', name: '___arquero_sql_group_a___'},
                {type: 'Column', name: '___arquero_sql_group_b___'},
                {type: 'Column', name: '___arquero_sql_group_c___'},
                {type: 'Column', name: '___arquero_sql_group_d___'},
                {type: 'Column', name: '___arquero_sql_group_f___'},
                {type: 'Column', name: '___arquero_sql_group_g___'},
              ],
            },
            _group: ['a', 'b', 'c', 'd', 'f', 'g'],
          },
          _columns: ['a', 'b', 'c', 'd', '___arquero_sql_predicate___'],
          _clauses: {where: [{type: 'Column', name: '___arquero_sql_predicate___'}]},
          _group: ['a', 'b', 'c', 'd', 'f', 'g'],
        },
        _columns: ['a', 'b', 'c', 'd'],
        _clauses: {
          select: [
            {type: 'Column', name: 'a'},
            {type: 'Column', name: 'b'},
            {type: 'Column', name: 'c'},
            {type: 'Column', name: 'd'},
            {type: 'Column', name: '___arquero_sql_group_a___'},
            {type: 'Column', name: '___arquero_sql_group_b___'},
            {type: 'Column', name: '___arquero_sql_group_c___'},
            {type: 'Column', name: '___arquero_sql_group_d___'},
            {type: 'Column', name: '___arquero_sql_group_f___'},
            {type: 'Column', name: '___arquero_sql_group_g___'},
          ],
        },
        _group: ['a', 'b', 'c', 'd', 'f', 'g'],
      },
      _columns: ['a', 'b', 'c', 'd'],
      _clauses: {},
      _group: null,
    },
    'produce correct query',
  );

  t.end();
});
