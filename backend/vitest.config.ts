import { defineConfig } from 'vitest/config'

// テストを2つに分ける(ADR 0017)
//   unit:        DB を使わない。npm test
//   integration: テスト用 DB を使う。npm run test:integration
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          include: ['src/**/*.int.test.ts'],
          setupFiles: ['dotenv/config'],
          globalSetup: ['src/test/integration/global-setup.ts'],
          // テスト同士が DB を取り合わないよう、1ファイルずつ順に実行する
          fileParallelism: false,
        },
      },
    ],
  },
})
