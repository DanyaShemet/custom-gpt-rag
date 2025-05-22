import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'
import parser from '@typescript-eslint/parser'

const sharedGlobals = {
  console: 'readonly',
  process: 'readonly',
  __dirname: 'readonly',
  module: 'readonly',
  require: 'readonly',
}

const sharedRules = {
  ...js.configs.recommended.rules,
  'no-console': 'off',
}

export default [
  {
    ignores: ['dist/**'],
  },
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
        project: './tsconfig.json',
      },
      globals: sharedGlobals,
    },
    plugins: {
      '@typescript-eslint': ts,
    },
    rules: {
      ...sharedRules,
      ...ts.configs.recommended.rules,
    },
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: sharedGlobals,
    },
    rules: sharedRules,
  },
]
