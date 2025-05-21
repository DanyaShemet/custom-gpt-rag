import js from '@eslint/js'

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        __dirname: 'readonly',
        module: 'readonly',
        require: 'readonly',
      },
    },
    plugins: {},
    rules: {
      ...js.configs.recommended.rules,
      'no-console': 'off',
    },
  },
]
