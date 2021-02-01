/** @typedef {import('./common').Verb} Verb */
/** @typedef {import('../sql-query').SqlQuery} SqlQuery */

import parseValue from 'arquero/src/verbs/util/parse';
import {inferKeys} from 'arquero/src/verbs/join';
import {all, not} from 'arquero';
import {internal} from 'arquero';
import isArray from 'arquero/src/util/is-array';
import isNumber from 'arquero/src/util/is-number';
import isString from 'arquero/src/util/is-string';
import toArray from 'arquero/src/util/to-array';

/** @type {['inner', 'left', 'right', 'outer']} */
const JOIN_OPTIONS = ['inner', 'left', 'right', 'outer'];

const OPT_L = {aggregate: false, window: false};
const OPT_R = {...OPT_L, index: 1};

const optParse = {join: true, ast: true};

/**
 *
 * @param {SqlQuery} query
 * @param {SqlQuery} other
 * @param {import('arquero/src/table/transformable').JoinPredicate} on
 * @param {import('arquero/src/table/transformable').JoinValues} values
 * @param {import('arquero/src/table/transformable').JoinOptions} options
 * @returns {SqlQuery}
 */
export default function (query, other, on, values, options = {}) {
  on = inferKeys(query, other, on);

  if (isArray(on)) {
    const [onL, onR] = on.map(toArray);
    if (onL.length !== onR.length) {
      throw new Error('Mismatched number of join keys');
    }

    const body = onL
      .map((l, i) => {
        l = isNumber(l) ? query.columnName(l) : l;
        const r = isNumber(onR[i]) ? other.columnName(onR[i]) : l;
        return `a.${l} === b.${r}`;
      })
      .join(' && ');
    on = `(a, b) => ${body}`;

    if (!values) {
      values = inferValues(query, onL, onR, options);
    }
  } else if (!values) {
    values = [all(), all()];
  }
  on = internal.parse({on}, {ast: true, join: true}).exprs[0];

  const {exprs, names} = parseValues(query, other, values, optParse, options.suffix);
  console.log(exprs, names);
  exprs.forEach((expr, i) => (expr.as = names[i]));

  const join_option = JOIN_OPTIONS[(~~options.left << 1) + ~~options.right];
  return query._wrap(
    {
      select: exprs,
      join: {other, on, join_option},
    },
    {columns: exprs.map(c => c.as || c.name)},
  );
}

/**
 *
 * @param {SqlQuery} queryL
 * @param {import('arquero/src/table/transformable').JoinKey[]} onL
 * @param {import('arquero/src/table/transformable').JoinKey[]} onR
 * @param {import('arquero/src/table/transformable').JoinOptions} options
 * @returns {import('arquero/src/table/transformable').JoinKey}
 */
function inferValues(tableL, onL, onR, options) {
  const isect = [];
  onL.forEach((s, i) => (isString(s) && s === onR[i] ? isect.push(s) : 0));
  const vR = not(isect);

  if (options.left && options.right) {
    // for full join, merge shared key columns together
    const shared = new Set(isect);
    return [
      tableL.columnNames().map(s => {
        const c = `[${toString(s)}]`;
        return shared.has(s) ? {[s]: `(a, b) => a${c} == null ? b${c} : a${c}`} : s;
      }),
      vR,
    ];
  }

  return options.right ? [vR, all()] : [all(), vR];
}

/**
 *
 * @param {SqlQuery} tableL
 * @param {SqlQuery} tableR
 * @param {import('arquero/src/table/transformable').JoinValues} values
 * @param {object} optParse
 * @param {string[]} suffix
 */
function parseValues(tableL, tableR, values, optParse, suffix = []) {
  if (isArray(values)) {
    let vL,
      vR,
      vJ,
      n = values.length;
    vL = vR = vJ = {names: [], exprs: []};

    if (n--) {
      vL = parseValue('join', tableL, values[0], optParse);
      // add table index
      // assignTable(vL.exprs, 1);
    }
    if (n--) {
      vR = parseValue('join', tableR, values[1], {...OPT_R, ...optParse});
      // add table index
      assignTable(vR.exprs, 2);
    }
    if (n--) {
      vJ = internal.parse(values[2], optParse);
    }

    // handle name collisions
    const rename = new Set();
    const namesL = new Set(vL.names);
    vR.names.forEach(name => {
      if (namesL.has(name)) {
        rename.add(name);
      }
    });
    if (rename.size) {
      rekey(vL.names, rename, suffix[0] || '_1');
      rekey(vR.names, rename, suffix[1] || '_2');
    }

    return {
      names: vL.names.concat(vR.names, vJ.names),
      exprs: vL.exprs.concat(vR.exprs, vJ.exprs),
    };
  } else {
    const v = internal.parse(values, optParse);
    assignTable(v, 1);
    return v;
  }
}

function rekey(names, rename, suffix) {
  names.forEach((name, i) => (rename.has(name) ? (names[i] = name + suffix) : 0));
}

function assignTable(expr, index) {
  if (typeof expr !== 'object') return;

  if (expr.type === 'Column') {
    expr.table = index;
  } else {
    Object.values(expr).forEach(e => assignTable(e, index));
  }
}
