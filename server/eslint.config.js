const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  {ignores: ['node_modules/', 'uploads/', 'coverage/']},
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {...globals.node},
    },
    rules: {
      'no-unused-vars': ['error', {argsIgnorePattern: '^_|^next$', varsIgnorePattern: '^_', caughtErrors: 'none'}],
      'no-console': ['warn', {allow: ['warn', 'error']}],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
    },
  },
  {
    // CLI scripts print progress to the terminal on purpose.
    files: ['scripts/**'],
    rules: {'no-console': 'off'},
  },
  {
    files: ['tests/**'],
    languageOptions: {globals: {...globals.node, ...globals.jest}},
  },
];
