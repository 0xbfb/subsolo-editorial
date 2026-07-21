import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const runtimeGlobals = Object.fromEntries(
  [
    'AbortController',
    'Buffer',
    'FormData',
    'HTMLElement',
    'HTMLFormElement',
    'HTMLOListElement',
    'Response',
    'URL',
    'URLSearchParams',
    'clearTimeout',
    'console',
    'document',
    'fetch',
    'localStorage',
    'location',
    'process',
    'setTimeout',
    'structuredClone',
  ].map((name) => [name, 'readonly']),
);

const typescriptRecommended = tseslint.configs.recommended.map((config) => ({
  ...config,
  files: ['**/*.ts'],
}));

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'references/**',
      'reports/**',
      '.runtime/**',
      '.tmp/**',
      '**/*.astro',
    ],
  },
  {
    ...eslint.configs.recommended,
    files: ['**/*.{js,mjs,cjs}'],
    rules: {
      ...eslint.configs.recommended.rules,
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: runtimeGlobals,
    },
  },
  {
    files: [
      'public/assets/search.js',
      'public/assets/theme.js',
      'scripts/audit-security.mjs',
      'scripts/check-boundaries.mjs',
      'scripts/test-all.mjs',
      'src/lib/infrastructure/google/google-drive.mjs',
      'src/lib/infrastructure/google/google-workspace.mjs',
      'src/lib/infrastructure/media/pillow-media-processor.mjs',
      'tests/ingestion/domain.test.mjs',
      'tests/observability/backup-manifest.test.mjs',
      'tests/visual/astro-source-static.test.mjs',
    ],
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: [
      'cli/packager-core.mjs',
      'scripts/check-minimum-permissions.mjs',
      'scripts/validate-infra.mjs',
      'tests/infra/compose-static.test.mjs',
    ],
    rules: {
      'no-regex-spaces': 'off',
    },
  },
  {
    files: [
      'scripts/check-boundaries.mjs',
      'src/lib/application/operational-observability.mjs',
      'src/lib/infrastructure/google/google-workspace.mjs',
      'tests/observability/infra-observability-static.test.mjs',
    ],
    rules: {
      'no-useless-escape': 'off',
    },
  },
  {
    files: [
      'scripts/validate-public-content.mjs',
      'src/lib/infrastructure/google/google-drive.mjs',
    ],
    rules: {
      'no-useless-assignment': 'off',
    },
  },
  {
    files: ['src/lib/domain/editorial-ingestion.mjs'],
    rules: {
      'no-control-regex': 'off',
    },
  },
  ...typescriptRecommended,
  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
  {
    files: ['src/lib/domain/identifiers.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    files: ['src/lib/domain/markdown-contract.ts'],
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: ['src/lib/domain/referential-validation.ts'],
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
);
