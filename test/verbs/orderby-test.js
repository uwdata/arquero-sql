import tape from 'tape';
import {desc} from 'arquero';
import {base, copy, onlyContainClsuses} from './common';

tape('verb: orderby', t => {
  const orderby = base.orderby(desc('a'), d => d.b * 2, desc({k: d => d.a + 3}));
  onlyContainClsuses(t, orderby, []);
  t.deepEqual(orderby._source, base, 'orderby wraps around the previous query');
  t.deepEqual(
    copy(orderby._order.exprs),
    [
      {type: 'Column', name: 'a'},
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'b'},
        operator: '*',
        right: {type: 'Literal', value: 2, raw: '2'},
      },
      {
        type: 'BinaryExpression',
        left: {type: 'Column', name: 'a'},
        operator: '+',
        right: {type: 'Literal', value: 3, raw: '3'},
      },
    ],
    'orderby annotate SqlQuery object with comparators',
  );
  t.deepEqual(orderby._order.descs, [true, false, true], 'orderby annotate SqlQuery object with order directions');

  t.end();
});

tape('verb: orderby before other query', t => {
  const orderby = base.orderby(desc('a')).filter(d => d.a === 1);
  t.deepEqual(
    copy(orderby._order.exprs),
    [{type: 'Column', name: 'a'}],
    'orderby annotate SqlQuery object with comparators',
  );
  t.deepEqual(orderby._order.descs, [true], 'orderby annotate SqlQuery object with order directions');

  t.end();
});
