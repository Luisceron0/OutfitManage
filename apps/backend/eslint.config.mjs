// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: {
          // test/**/*.ts queda fuera de tsconfig.json a propósito (ver su "exclude": ["test"]
          // — los e2e usan su propio tsconfig vía test/jest-e2e.json). Sin esta línea, el
          // linter no encuentra ningún proyecto TS que cubra esos archivos y falla al parsear.
          allowDefaultProject: ['test/*.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    // Los tipos de Jest (jest.fn() sin genéricos, expect.objectContaining, Promise.catch)
    // resuelven a `any` en sus propias declaraciones de @types/jest — no es un problema del
    // código de este proyecto, es una limitación conocida y aceptada del ecosistema Jest +
    // TypeScript. Las reglas no-unsafe-* existen para atrapar `any` que se filtra desde
    // código de producción, no ruido proveniente del propio framework de test.
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },
);