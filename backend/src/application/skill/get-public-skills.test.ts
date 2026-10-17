import { describe, expect, it } from 'vitest'
import { createGetPublicSkills } from './get-public-skills.js'
import type { PublicSkillCategoryRecord, PublicSkillQuery, PublicSkillRecord } from './public-skill-query.js'

// DB を使わず、フェイクの実装を渡してテストする(ADR 0017)
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

function fakeSkillQuery(categories: PublicSkillCategoryRecord[]): PublicSkillQuery {
  return {
    // 本物の実装と同じく、指定した言語の翻訳だけを返す
    findAll: async (locales) =>
      categories.map((category) => ({
        ...category,
        translations: category.translations.filter((t) => locales.includes(t.locale)),
      })),
  }
}

const skills: PublicSkillRecord[] = [
  { id: 11, name: 'EC2', isFeatured: false },
  { id: 12, name: 'EKS', isFeatured: true },
]

// テストの土台にするカテゴリ。ケースごとに ...cloud で写して一部だけ変える
const cloud: PublicSkillCategoryRecord = {
  id: 1,
  translations: [
    { locale: 'ja', name: 'クラウド' },
    { locale: 'en', name: 'Cloud' },
  ],
  skills,
}

describe('getPublicSkills', () => {
  it('[正常系] en の翻訳があるカテゴリは en で返す', async () => {
    // Arrange
    const getPublicSkills = createGetPublicSkills({
      skillQuery: fakeSkillQuery([cloud]),
    })

    // Act
    const result = await getPublicSkills({ locale: 'en' })

    // Assert
    // メモ：ファースト正常系はtoEqualでオブジェクト構造を検証するとよい
    expect(result).toEqual([
      {
        id: 1,
        locale: 'en',
        name: 'Cloud',
        skills: [
          { id: 11, name: 'EC2', isFeatured: false },
          { id: 12, name: 'EKS', isFeatured: true },
        ],
      },
    ])
  })

  it('[正常系] en の翻訳がないカテゴリは ja で返す', async () => {
    // Arrange
    const getPublicSkills = createGetPublicSkills({
      skillQuery: fakeSkillQuery([
        {
          ...cloud,
          translations: [
            { locale: 'ja', name: 'クラウド' }
          ]
        }
      ]),
    })

    // Act
    const result = await getPublicSkills({ locale: 'en' })

    // Assert
    expect(result[0]).toMatchObject({
      locale: 'ja',
      name: 'クラウド',
    })
  })

  it('[正常系] スキルが 0 件のカテゴリと、翻訳がないカテゴリは外す', async () => {
    // Arrange
    const getPublicSkills = createGetPublicSkills({
      skillQuery: fakeSkillQuery([
        cloud,                              // 残るはず
        { ...cloud, id: 2, skills: [] },    // スキル 0 件 なので外れるはず
        { ...cloud, id: 3, translations: [] }, // 翻訳がないので外れるはず
      ]),
    })

    // Act
    const result = await getPublicSkills({ locale: 'en' })

    // Assert
    expect(result.map((c) => c.id)).toEqual([1])
  })

  it('[正常系] 1 件もなければ空の配列を返す', async () => {
    // Arrange
    const getPublicSkills = createGetPublicSkills({
      skillQuery: fakeSkillQuery([]),
    })

    // Act
    const result = await getPublicSkills({ locale: 'en' })

    // Assert
    expect(result).toHaveLength(0)
  })
})
