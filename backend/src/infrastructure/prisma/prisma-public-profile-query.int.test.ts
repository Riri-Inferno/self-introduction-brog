import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestPrisma, resetDatabase } from '../../test/integration/db.js'
import { createPrismaPublicProfileQuery } from './prisma-public-profile-query.js'

// テスト用 DB を使う統合テスト(ADR 0017)
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const prisma = createTestPrisma()
const query = createPrismaPublicProfileQuery(prisma)

beforeEach(async () => {
  await resetDatabase(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaPublicProfileQuery.find', () => {
  it('[正常系] 指定した言語の翻訳だけを返す', async () => {
    // Arrange
    await prisma.profile.create({
      data: {
        avatarKey: 'profile/avatar.png',
        translations: {
          create: [
            { locale: 'ja', name: '山田 太郎' },
            { locale: 'en', name: 'Taro Yamada' },
          ],
        },
      },
    })

    // Act
    const profile = await query.find(['en'])

    // Assert
    expect(profile).toMatchObject({
      avatarKey: 'profile/avatar.png',
      updatedAt: expect.any(Date),
      translations: [{ locale: 'en', name: 'Taro Yamada', nameKana: null }],
    })
  })

  it('[異常系] プロフィールがなければ null を返す', async () => {
    // Arrange
    // DB は beforeEach で空にしてある

    // Act
    const profile = await query.find(['ja'])

    // Assert
    expect(profile).toBeNull()
  })
})
