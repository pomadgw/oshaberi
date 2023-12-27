/* eslint-env node */
module.exports = {
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": ["standard-with-typescript", "prettier"],
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "exclude": ["*.cjs"],
  "plugins": ["prettier", "unused-imports", "import"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/return-await": "off",
    "@typescript-eslint/explicit-function-return-type": "off",
    "unused-imports/no-unused-vars": [
      "warn",
      {
        "vars": "all",
        "varsIgnorePattern": "^_",
        "args": "after-used",
        "argsIgnorePattern": "^_"
      }
    ],
    // /end Unused Import
    "import/order": [
      "error",
      {
        "groups": [
          "builtin",
          "external",
          ["internal", "parent", "sibling", "index"],
          "type",
          "unknown"
        ],
        "pathGroupsExcludedImportTypes": [],
        "newlines-between": "always"
      }
    ]
  }
}
