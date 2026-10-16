import { describe, expect, it } from 'vitest'
import { NotFoundError } from '../../domain/errors.js'
import type { ImageStorage } from '../ports/image-storage.js'
import { createGetPublicProfile } from './get-public-profile.js'
import type { PublicProfileQuery, PublicProfileRecord } from './public-profile-query.js'

// DB を使わず、フェイクの実装を渡してテストする(ADR 0017)
// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const fakeImageStorage: ImageStorage = {
  put: async () => {},
  delete: async () => {},
  url: (key) => `https://images.example.com/${key}`,
}

function fakeProfileQuery(record: PublicProfileRecord | null): PublicProfileQuery {
  return {
    // 本物の実装と同じく、指定した言語の翻訳だけを返す
    find: async (locales) =>
      record && {
        ...record,
        translations: record.translations.filter((t) => locales.includes(t.locale)),
      },
  }
}

const updatedAt = new Date('2026-10-01T00:00:00Z')
const jaText = {
  locale: 'ja' as const,
  name: '山田 太郎',
  nameKana: 'やまだ たろう',
  title: 'クラウドエンジニア',
  summary: null,
  selfPr: null,
}

describe('getPublicProfile', () => {
  it('[正常系] 指定した言語のプロフィールを返し、画像のキーを URL にする', async () => {
    // Arrange
    const getPublicProfile = createGetPublicProfile({
      profileQuery: fakeProfileQuery({
        avatarKey: 'profile/avatar.png',
        updatedAt,
        translations: [jaText, { ...jaText, locale: 'en', name: 'Taro Yamada' }],
      }),
      imageStorage: fakeImageStorage,
    })

    // Act
    const profile = await getPublicProfile({ locale: 'en' })

    // Assert
    expect(profile).toMatchObject({
      locale: 'en',
      name: 'Taro Yamada',
      avatarUrl: 'https://images.example.com/profile/avatar.png',
      updatedAt,
    })
  })

  it('[正常系] 英訳がなければ日本語を返す', async () => {
    // Arrange
    const getPublicProfile = createGetPublicProfile({
      profileQuery: fakeProfileQuery({ avatarKey: null, updatedAt, translations: [jaText] }),
      imageStorage: fakeImageStorage,
    })

    // Act
    const profile = await getPublicProfile({ locale: 'en' })

    // Assert
    expect(profile.locale).toBe('ja')
    expect(profile.avatarUrl).toBeNull()
  })

  it('[異常系] プロフィールがなければ NotFoundError を投げる', async () => {
    // Arrange
    const getPublicProfile = createGetPublicProfile({
      profileQuery: fakeProfileQuery(null),
      imageStorage: fakeImageStorage,
    })

    // Act
    const result = getPublicProfile({ locale: 'ja' })

    // Assert
    await expect(result).rejects.toThrow(NotFoundError)
  })

  it('[異常系] 翻訳が1件もなければ NotFoundError を投げる', async () => {
    // Arrange
    const getPublicProfile = createGetPublicProfile({
      profileQuery: fakeProfileQuery({ avatarKey: null, updatedAt, translations: [] }),
      imageStorage: fakeImageStorage,
    })

    // Act
    const result = getPublicProfile({ locale: 'ja' })

    // Assert
    await expect(result).rejects.toThrow(NotFoundError)
  })
})
