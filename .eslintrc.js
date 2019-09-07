module.exports = {
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      legacyDecorators: true
    }
  },
  extends: ['standard', 'plugin:jest/recommended'],
  rules: {
    'prefer-promise-reject-errors': 0
  }
}
