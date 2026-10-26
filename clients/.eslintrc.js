module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Data-loading callbacks are intentionally run only on focus/mount.
    'react-hooks/exhaustive-deps': 'warn',
  },
};
