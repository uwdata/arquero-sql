import json from '@rollup/plugin-json';
import bundleSize from 'rollup-plugin-bundle-size';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

function onwarn(warning, defaultHandler) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    defaultHandler(warning);
  }
}

const name = 'aqsql';
const external = [ 'arquero', 'fast-csv', 'uuid' ];
const globals = { 'arquero': 'arquero', 'fast-csv': 'csv', 'uuid': 'uuid' };

const plugins = [
  json(),
  bundleSize(),
  nodeResolve({ modulesOnly: true }),
];

export default [
  {
    input: 'src/index-node.js',
    external: external,
    plugins,
    onwarn,
    output: [
      {
        file: 'dist/arquero-sql.node.js',
        format: 'cjs',
        name
      }
    ]
  },
  {
    input: 'src/index.js',
    external,
    plugins,
    onwarn,
    output: [
      {
        file: 'dist/arquero-sql.js',
        format: 'umd',
        globals,
        name
      },
      {
        file: 'dist/arquero-sql.min.js',
        format: 'umd',
        sourcemap: true,
        plugins: [ terser({ ecma: 2018 }) ],
        globals,
        name
      }
    ]
  }
];

// export default {
//   input: 'src/index.js',
//   plugins: [
//     json(),
//     bundleSize(),
//     nodeResolve({ modulesOnly: true })
//   ],
//   onwarn,
//   output: [
//     {
//       file: 'dist/arquero-sql.js',
//       name: 'aq',
//       format: 'umd'
//     },
//   ]
// };