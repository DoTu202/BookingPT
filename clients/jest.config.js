const preset = require('react-native/jest-preset');

module.exports = {
  preset: 'react-native',
  // The preset only transforms .js/.ts/.tsx; components are .jsx.
  transform: {...preset.transform, '^.+\\.jsx$': 'babel-jest'},
};
