import tape from 'tape';
import {base, base2, base3, group} from './verbs/common';
import codeGen from '../src/code-gen';
import {all, desc, not, op} from 'arquero';

tape('code-gen', t => {
  // TODO: do real testing

  const cg1 = base.filter(d => d.a !== 2);
  console.log(codeGen(cg1));

  const cg2 = group.filter(d => op.mean(d.c) === 5);
  console.log(codeGen(cg2));

  const cg3 = group.rollup({f: d => op.mean(d.c)});
  console.log(codeGen(cg3));

  const cg4 = group.dedupe('c', 'b');
  console.log(codeGen(cg4));

  const cg5 = base.concat(base2, base3);
  console.log(codeGen(cg5));

  const cg6 = base.join(base3, 'a', [all(), not('e')], {left: true});
  console.log(codeGen(cg6));

  const cg7 = base.sample(5);
  console.log(codeGen(cg7));

  const cg8 = base.orderby(d => d.a + 2, 'b', desc('c'));
  console.log(codeGen(cg8));

  t.end();
});
