import { describe, expect, it } from 'vitest'
import { buildApp } from './app.js'
import { fakeUsecases } from './test/fake-usecases.js'

// OpenAPI が Zod のスキーマから作られることを確かめる(ADR 0014)
// @fastify/swagger の読み込みに時間がかかるので、タイムアウトを長くしている
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

describe('OpenAPI', () => {
  it('[正常系] ルートとスキーマが /docs/json に出る', { timeout: 30_000 }, async () => {
    // Arrange
    const app = await buildApp({ docs: true, usecases: fakeUsecases() })

    // Act
    const res = await app.inject({ method: 'GET', url: '/docs/json' })

    // Assert
    const doc = res.json()
    expect(res.statusCode).toBe(200)
    expect(doc.paths['/api/public/profile'].get.tags).toEqual(['public'])
    expect(doc.components.schemas).toHaveProperty('PublicProfile')
    expect(doc.components.schemas).toHaveProperty('ErrorResponse')
  })
})
