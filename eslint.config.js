import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'assets-originais'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    ignores: ['src/engine/__tests__/**'],
    rules: {
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use rng.ts com a seed.' },
        { object: 'Date', property: 'now', message: 'Motor determinístico: sem relógio.' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            'react',
            'react-dom',
            'framer-motion',
            'lucide-react',
            '**/ui/**',
            '**/state/**',
          ],
        },
      ],
    },
  },
);
