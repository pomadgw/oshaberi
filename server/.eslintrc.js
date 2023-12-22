export default {
  env: {
    es2021: true,
    node: true
  },
  extends: ['standard-with-typescript', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    'prettier',
    'unused-imports',
    'plugin:import/recommended',
    'plugin:import/typescript'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/return-await': 'off',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_'
      }
    ],
    // /end Unused Import
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          ['internal', 'parent', 'sibling', 'index'],
          'type',
          'unknown'
        ],
        pathGroupsExcludedImportTypes: [],
        'newlines-between': 'always'
      }
    ]
  }
}
