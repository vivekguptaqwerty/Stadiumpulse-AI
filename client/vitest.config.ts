import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      include: ['src/__tests__/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json-summary', 'html'],
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'src/__tests__/**/*',
          'src/setupTests.ts',
          'src/main.tsx',
          'src/types/**/*',
          'src/vite-env.d.ts'
        ]
      }
    }
  })
);
