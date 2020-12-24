module.exports = {
  'extends': 'airbnb',
  'parser': 'babel-eslint',
  'env': {
    'jest': true,
  },
  'rules': {
    'no-use-before-define': 'off',
    'react/jsx-filename-extension': 'off',
    'react/prop-types': 'off',
    'react/prefer-stateless-function': 'off',
    'react/no-array-index-key': 'off',
    'global-require': 'off',
    'consistent-return': 'off',
    'jsx-a11y/accessible-emoji': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
  },
  'globals': {
    "fetch": false,
    "FormData": false,
  },
}