module.exports = {
    'extends': [
        "plugin:@typescript-eslint/recommended",
        "prettier",
        "prettier/@typescript-eslint",
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
    "project": "./tsconfig.json",
    },
    'plugins': [
        'import',
        '@typescript-eslint',
    ],
    'rules': {
        "@typescript-eslint/explicit-member-accessibility": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/no-non-null-assertion": 0,
        "@typescript-eslint/array-type": 0,
        "@typescript-eslint/camelcase": 0,
    }
};
