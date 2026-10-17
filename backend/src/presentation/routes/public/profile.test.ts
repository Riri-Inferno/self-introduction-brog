import { describe, expect, it } from 'vitest'
import { buildApp } from '../../../app.js'
import type { GetPublicProfile, PublicProfile } from '../../../application/profile/get-public-profile.js'
import { NotFoundError } from '../../../domain/errors.js'
import { fakeUsecases } from '../../../test/fake-usecases.js'

// buildApp にフェイクのユースケースを渡し、app.inject() でリクエストを送る(ADR 0017)
// サーバーは起動せず、DB も使わない
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const profile: PublicProfile = {
  locale: 'ja',
  name: '山田 太郎',
  nameKana: null,
  title: 'クラウドエンジニア',
  summary: null,
  selfPr: null,
  avatarUrl: null,
  updatedAt: new Date('2026-10-01T00:00:00Z'),
}

function setup(getPublicProfile: GetPublicProfile) {
  return buildApp({ usecases: fakeUsecases({ getPublicProfile }) })
}

describe('GET /api/public/profile', () => {
  it('[正常系] data で包んで返す。日時は ISO 8601 の文字列にする', async () => {
    // Arrange
    const app = await setup(async () => profile)

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/profile' })

    // Assert
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({
      data: { ...profile, updatedAt: '2026-10-01T00:00:00.000Z' },
    })
  })

  it('[正常系] locale を省略したら ja でユースケースを呼ぶ', async () => {
    // Arrange
    let received: string | undefined
    const app = await setup(async ({ locale }) => {
      received = locale
      return profile
    })

    // Act
    await app.inject({ method: 'GET', url: '/api/public/profile' })

    // Assert
    expect(received).toBe('ja')
  })

  it('[正常系] スキーマにないフィールドはレスポンスに出さない', async () => {
    // Arrange
    const app = await setup(async () => ({ ...profile, avatarKey: 'secret/key.png' }))

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/profile' })

    // Assert
    expect(res.json().data).not.toHaveProperty('avatarKey')
  })

  it('[異常系] locale が不正なら 400 VALIDATION_ERROR を返す', async () => {
    // Arrange
    const app = await setup(async () => profile)

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/profile?locale=jp' })

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

  it('[異常系] プロフィールがなければ 404 NOT_FOUND を返す', async () => {
    // Arrange
    const app = await setup(async () => {
      throw new NotFoundError({ resource: 'Profile', message: 'プロフィールが登録されていません' })
    })

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/profile' })

    // Assert
    expect(res.statusCode).toBe(404)
    expect(res.json().error.code).toBe('NOT_FOUND')
  })

  it('[異常系] 想定外のエラーは 500 INTERNAL_ERROR にし、内部の情報を返さない', async () => {
    // Arrange
    const app = await setup(async () => {
      throw new Error('connection refused: postgresql://app:app@localhost')
    })

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/profile' })

    // Assert
    expect(res.statusCode).toBe(500)
    expect(res.json().error.code).toBe('INTERNAL_ERROR')
    expect(res.body).not.toContain('postgresql')
  })
})

describe('存在しないパス', () => {
  it('[異常系] 404 NOT_FOUND を同じ形で返す', async () => {
    // Arrange
    const app = await setup(async () => profile)

    // Act
    const res = await app.inject({ method: 'GET', url: '/api/public/nothing' })

    // Assert
    expect(res.statusCode).toBe(404)
    expect(res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } })
  })
})
