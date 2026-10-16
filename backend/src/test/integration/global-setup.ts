import { execFileSync } from 'node:child_process'
import 'dotenv/config'
import { testDatabaseUrl } from './db.js'

// 統合テストの前に1回だけ、テスト用 DB にマイグレーションを適用する(CHECK 制約も入る)
export default function setup(): void {
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'inherit',
  })
}
