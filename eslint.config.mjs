import js from '@eslint/js';

/**
 * ESLint Flat Config for VF DAO Eco Engine Monorepo
 * Root-level configuration with shared rules
 */
export default [
  // Base recommended rules
  js.configs.recommended,
  
  {
    // Global ignores
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.turbo/**',
      '**/out/**',
      '**/.cache/**',
      '**/coverage/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
      '**/pnpm-lock.yaml',
    ],
  },
  
  {
    // Root-level rules for JavaScript files
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
      },
    },
    rules: {
      // Best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'warn',
      'prefer-arrow-callback': 'warn',
      'arrow-body-style': ['warn', 'as-needed'],
      
      // Code quality
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'curly': ['warn', 'multi-line'],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-with': 'error',
      
      // Style (minimal - let Prettier handle most)
      'semi': ['warn', 'always'],
      'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'comma-dangle': ['warn', 'always-multiline'],
    },
  },
];
