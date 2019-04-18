module.exports = {
    'extends': [
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "prettier/@typescript-eslint",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "useJSXTextNode": true,
    "project": "./tsconfig.json",
    "tsconfigRootDir": "../../",
    "extraFileExtensions": [".vue"]
    },
    'plugins': [
        'import',
        '@typescript-eslint',
    ],
    'rules': {
        "interface-name": false,
        "no-unused-expression": [true, "allow-fast-null-checks"],
        "object-literal-sort-keys": [true, "shorthand-first"]
    }
};
