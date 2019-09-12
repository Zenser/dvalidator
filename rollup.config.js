// rollup.config.js
const config = require('./package.json')
const rollupTypescript = require('rollup-plugin-typescript2')

module.exports = {
  input: 'index.ts',
  output: {
    file: 'lib/index.js',
    name: 'index',
    format: 'umd',
    banner: `/*!
* dvalidator.js v${config.version}
* (c) 2019 zeus
* Released under the MIT License.
*/`
  },
  context: __dirname,
  plugins: [
    rollupTypescript()
  ]
}
