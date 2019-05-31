module.exports = {
  presets: [
    [
      '@babel/env',
      {
        modules: 'umd'
      }
    ]
  ],
  plugins: [
    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true
      }
    ]
  ]
}
