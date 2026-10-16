import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestPrisma, resetDatabase } from '../../test/integration/db.js'

// マイグレーション SQL に手で追記した CHECK 制約が入っているかを確かめる(ADR 0010, 0017)
// 制約を足したら、ここにもテストを足す
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const prisma = createTestPrisma()

beforeEach(async () => {
  await resetDatabase(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('CHECK 制約', () => {
  it('[正常系] CHECK 制約が13個ある', async () => {
    // Arrange
    // マイグレーションは global-setup.ts で適用済み

    // Act
    const rows = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT count(*) FROM pg_constraint
      WHERE contype = 'c' AND connamespace = 'public'::regnamespace
    `

    // Assert
    expect(Number(rows[0]?.count)).toBe(13)
  })

  it('[異常系] Profile の id は 1 以外にできない', async () => {
    // Arrange
    const data = { id: 2 }

    // Act
    const result = prisma.profile.create({ data })

    // Assert
    await expect(result).rejects.toThrow(/Profile_id_singleton_check/)
  })

  it('[異常系] 翻訳の locale は ja / en 以外にできない', async () => {
    // Arrange
    await prisma.profile.create({ data: {} })

    // Act
    const result = prisma.profileTranslation.create({
      data: { profileId: 1, locale: 'jp', name: '山田' },
    })

    // Assert
    await expect(result).rejects.toThrow(/ProfileTranslation_locale_check/)
  })

  it('[異常系] 終了日を開始日より前にできない', async () => {
    // Arrange
    const data = { startedAt: new Date('2024-04-01'), endedAt: new Date('2024-03-01') }

    // Act
    const result = prisma.career.create({ data })

    // Assert
    await expect(result).rejects.toThrow(/Career_period_check/)
  })
})
