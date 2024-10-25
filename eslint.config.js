import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
// import safeql from '@ts-safeql/eslint-plugin/config'
import prettierConfig from 'eslint-config-prettier'
import sortKeyFix from 'eslint-plugin-sort-keys-fix'
import noRelativeImportPaths from 'eslint-plugin-no-relative-import-paths'
import sortImports from 'eslint-plugin-sort-imports-es6-autofix'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  prettierConfig,
  {
    plugins: {
      'sort-keys-fix': sortKeyFix,
      'no-relative-import-paths': noRelativeImportPaths,
      'sort-imports-es6-autofix': sortImports,
    },
    rules: {
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      'sort-keys-fix/sort-keys-fix': 'error',
      'no-relative-import-paths/no-relative-import-paths': [
        'error',
        { allowSameFolder: false },
      ],

      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true, // Because we use import/order
          ignoreMemberSort: false,
          memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
          allowSeparatedGroups: true,
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    ignores: ['node_modules', 'dist'],
  },
  {
    files: ['src/generated/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      'sort-keys-fix/sort-keys-fix': 'off',
      'sort-keys': 'off',
    },
  }
)
