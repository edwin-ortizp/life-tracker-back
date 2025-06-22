import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*'],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
        __dirname: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },      rules: {
        ...tsPlugin.configs.recommended.rules,
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        // Desactivar algunas reglas que pueden ser demasiado estrictas
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-explicit-any': 'warn',
        // Permitir uso de no-undef en archivos específicos
        'no-undef': ['error', { typeof: true }],
      },
  },
  {
    files: ['service-worker.ts'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        self: 'readonly',
        ServiceWorkerGlobalScope: 'readonly',
      },
    },
  },
  {
    files: ['shared.js', 'post-build-windows.js', 'post-build-mac.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
