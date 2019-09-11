module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          node: 'current'
        },
        modules: process.env.NODE_ENV === 'test' ? 'umd' : false
      }
    ]
  ],
  plugins: [
    ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: false }],
    ['@babel/plugin-proposal-class-properties']
  ]
}
