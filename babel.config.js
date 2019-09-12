// for run-script test
module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: 'current'
        }
      }
    ],
    '@babel/preset-typescript'
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: false }],
    ['@babel/plugin-proposal-class-properties']
  ]
}
