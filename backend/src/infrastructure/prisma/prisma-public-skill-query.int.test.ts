import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { createTestPrisma, resetDatabase } from '../../test/integration/db.js'
import { createPrismaPublicSkillQuery } from './prisma-public-skill-query.js'

// テスト用 DB を使う統合テスト (ADR 0017)
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const prisma = createTestPrisma()
const query = createPrismaPublicSkillQuery(prisma)

beforeEach(async () => {
  await resetDatabase(prisma)
})

afterAll(async () => {
  await prisma.$disconnect()
})

describe('PrismaPublicSkillQuery.findAll', () => {
  it('[正常系] 指定した言語の翻訳だけを返す', async () => {
    // Arrange
    await prisma.skillCategory.create({
      data: {
        sortOrder: 1,
        translations: { 
          create: [
            { locale: 'ja', name: 'クラウド' },
            { locale: 'en', name: 'Cloud' },
          ] 
        },
        skills: { create: [{ name: 'EC2', sortOrder: 1 }, { name: 'EKS', sortOrder: 2 }] },
      },
    })

    // Act
    const categories = await query.findAll(['en'])

    // Assert
    // translations が en だけになること
    expect(categories[0].translations).toEqual([{ locale: 'en', name: 'Cloud' }])
    expect(categories[0].skills[0]).toEqual({ id: expect.any(Number), name: 'EC2', isFeatured: false })
  })

  it('[正常系] カテゴリとスキルを sortOrder の順に返す', async () => {
    // Arrange
    await prisma.skillCategory.create({
      data: {
        sortOrder: 2,
        translations: { create: [{ locale: 'ja', name: 'カテゴリB' }] },
        skills: {
          create: [
            { name: 'SkillB2', sortOrder: 2 },  // 先に登録するが、後に並ぶはず
            { name: 'SkillB1', sortOrder: 1 },
          ],
        },
      },
    })
    await prisma.skillCategory.create({
      data: {
        sortOrder: 1,
        translations: { create: [{ locale: 'ja', name: 'カテゴリA' }] },
        skills: {
          create: [
            { name: 'SkillA', sortOrder: 1 }
          ]
        },
      },
    })

    // Act
    const categories = await query.findAll(['ja'])

    // Assert
    // sortOrder の順に A → B、A の中のスキルは A1 → A2 に並ぶこと
    expect(categories.map((c) => c.translations[0].name)).toEqual(['カテゴリA', 'カテゴリB'])
    expect(categories[1].skills.map((s) => s.name)).toEqual(['SkillB1', 'SkillB2'])
  })

  it('[正常系] 1 件もなければ空の配列を返す', async () => {
    // Arrange
    // すでにbeforeEach で空にしてあるはず

    // Act
    const categories = await query.findAll(['ja'])

    // Assert
    // [] が返るはず
    expect(categories).toEqual([])
  })
})
