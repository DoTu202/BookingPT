const path = require('path');

module.exports = {
  root: true,
  extends: '@react-native',
  parserOptions: {
    // Editors often run ESLint from the repo root; without this the Babel
    // parser looks for babel.config.js there and fails on every file
    // ("No Babel config file detected", shown on the first import).
    babelOptions: {configFile: path.join(__dirname, 'babel.config.js')},
  },
  rules: {
    // Data-loading callbacks are intentionally run only on focus/mount.
    'react-hooks/exhaustive-deps': 'warn',
  },
};
