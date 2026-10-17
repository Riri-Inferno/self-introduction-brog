import { describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'
import type { GetPublicSkills, PublicSkillCategory } from '../../../application/skill/get-public-skills.js'
import { fakeUsecases } from '../../../test/fake-usecases.js'
import type { Locale } from '../../../domain/locale.js'

// buildApp にフェイクのユースケースを渡し、app.inject() でリクエストを送る(ADR 0017)
// サーバーは起動せず、DB も使わないプレゼンテーション層のみのテスト
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const category: PublicSkillCategory = {
  id: 1,
  locale: 'ja',
  name: 'クラウド',
  skills: [
    { id: 2, name: 'EC2', isFeatured: false },
    { id: 3, name: 'EKS', isFeatured: true },
  ],
}

function setup(getPublicSkills: GetPublicSkills) {
  return buildApp({ usecases: fakeUsecases({ getPublicSkills }) })
}

describe('GET /api/public/skills', () => {
  it('[正常系] data の categories で包んで返す', async () => {
    // Arrange
    const app = await setup(async () => [category])

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/skills' })

    // Assert
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      data: {
        categories: [category],
      },
    })
  })

  it('[正常系] locale を省略したら ja でユースケースを呼ぶ', async () => {
    // Arrange
    let receivedLocale: Locale | undefined
    const app = await setup(async ({ locale }) => {
      receivedLocale = locale
      return [category]
    })

    // Act
    await app.inject({ method: 'GET', url: '/api/public/skills' })

    // Assert
    expect(receivedLocale).toBe('ja')
  })
  
  it('[正常系] 1 件もなければ categories を空の配列で返す', async () => {
    // Arrange
    const app = await setup(async () => [])

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/skills' })

    // Assert
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ data: { categories: [] } })
  })

  it('[正常系] スキーマにないフィールドはレスポンスに出ない', async () => {
    // Arrange
    const app = await setup(async () => [{ ...category, sortOrder: 1 }])

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/skills' })

    // Assert
    expect(res.statusCode).toBe(200)
    expect(res.json().data.categories[0]).not.toHaveProperty('sortOrder') // sortOrderは表には出ないはず
  })

  it('[異常系] locale が不正なら 400 VALIDATION_ERROR を返す', async () => {
    // Arrange
    const app = await setup(async () => [category])

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/skills?locale=jp' })

    // Assert
    expect(res.statusCode).toBe(400)
    expect(res.json()).toMatchObject({
      error: {
        code: 'VALIDATION_ERROR',
        details: [{ path: 'locale' }],
        requestId: expect.any(String),
      },
    })
  })

  it('[異常系] 想定外のエラーは 500 INTERNAL_ERROR にする', async () => {
    // Arrange
    const app = await setup(async () => {
      throw new Error('Database connection failed')
    })

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/skills' })

    // Assert
    expect(res.statusCode).toBe(500)
    expect(res.json().error.code).toBe('INTERNAL_ERROR')
  })
})
