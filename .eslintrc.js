module.exports = {
  extends: [
    'eslint:recommended'
  ],
  env: {
    es6: true,
    browser: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module'
  },
  rules: {
    'no-console': ['warn', {allow: ['warn', 'error']}],
    'no-cond-assign': 'off',
    'no-fallthrough': ['error', { commentPattern: 'break omitted' }],
    'semi': 'error',
    'quotes': ['error', 'single', { avoidEscape: true }],
    'prefer-const': 'error',
    'sort-imports': ['error', {
      ignoreCase: false,
      ignoreDeclarationSort: true
    }]
  }
};
