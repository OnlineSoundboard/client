import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import polyfill from 'rollup-plugin-polyfill-node'
import terser from '@rollup/plugin-terser'
const pkg = require('./package.json')
const name = pkg.name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1, w.length)).join('')
const banner = `/*!
 * ${name}
 * Copyright (c) 2022 Dastan21
 */`

const createConfig = ({ input, file, format, exports }) => {
  return {
    input,
    output: [{
      file,
      format,
      name,
      banner,
      exports
    }],
    plugins: [
      commonjs(),
      polyfill(),
      resolve({ browser: true, preferBuiltins: true }),
      terser()
    ]
  }
}

export default ([
  createConfig({ input: 'lib/cjs/index.js', file: `dist/${pkg.name}.min.js`, format: 'umd' }),
  createConfig({ input: 'lib/esm/index.js', file: `dist/${pkg.name}.esm.min.js`, format: 'esm', exports: 'named' })
])
