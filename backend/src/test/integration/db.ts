import { createPrismaClient, type PrismaClient } from '../../infrastructure/prisma/client.js'

// 統合テスト用の DB(ADR 0017)

/**
 * TEST_DATABASE_URL を返す。
 * テーブルを空にするので、DB 名が _test で終わらなければ止める。開発用の DB を消さないため。
 */
export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error('TEST_DATABASE_URL が設定されていません(.env.example を参照)')
  }
  if (!new URL(url).pathname.endsWith('_test')) {
    throw new Error(`TEST_DATABASE_URL の DB 名は _test で終わる必要があります: ${url}`)
  }
  return url
}

export function createTestPrisma(): PrismaClient {
  return createPrismaClient(testDatabaseUrl())
}

/** マイグレーションの履歴以外のテーブルをすべて空にする */
export async function resetDatabase(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `
  if (tables.length === 0) return
  const names = tables.map((t) => `"public"."${t.tablename}"`).join(', ')
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE`)
}
