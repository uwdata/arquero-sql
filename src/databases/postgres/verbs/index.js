import __concat from './concat';
import __dedupe from './dedupe';
import __derive from './derive';
import __except from './except';
import __filter from './filter';
import __fold from './fold';
import __groupby from './groupby';
import __intersect from './intersect';
import __join from './join';
import __orderby from './orderby';
import __rollup from './rollup';
import __sample from './sample';
import __select from './select';
import __ungroup from './ungroup';
import __union from './union';
import __unorder from './unorder';

import {op} from 'arquero';

export default {
  // __antijoin: (table, other, on) =>
  //   __semijoin(table, other, on, { anti: true }),
  __count: (table, options = {}) => __rollup(table, {[options.as || 'count']: op.count()}),
  __cross: (table, other, values, options) =>
    __join(table, other, () => true, values, {
      ...options,
      left: true,
      right: true,
    }),
  __concat,
  __dedupe,
  __derive,
  __except,
  __filter,
  __fold,
  // __impute,
  __intersect,
  __join,
  // __lookup,
  // __pivot,
  // __relocate,
  // __rename,
  __rollup,
  __sample,
  __select,
  // __semijoin,
  // __spread,
  __union,
  // __unroll,
  __groupby,
  __orderby,
  __ungroup,
  __unorder,
  // __reduce,
};
