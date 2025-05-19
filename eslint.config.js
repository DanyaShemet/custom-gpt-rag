import js from '@eslint/js'
import ts from '@typescript-eslint/eslint-plugin'

export default [
    {
       ...js.configs.recommended,
        env: {
            node: true, // 🟢 потрібна частина!
            es2021: true,
        },
        files: ['**/*.ts'],
        languageOptions: {
            parser: await import('@typescript-eslint/parser'),
        },
        plugins: {
            '@typescript-eslint': ts,
        },
        rules: {
            '@typescript-eslint/no-unused-vars': 'warn',
        },
    },
]
