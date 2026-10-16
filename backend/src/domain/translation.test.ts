import { describe, expect, it } from 'vitest'
import { selectTranslation } from './translation.js'

// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

describe('selectTranslation', () => {
  const ja = { locale: 'ja' as const, name: '山田' }
  const en = { locale: 'en' as const, name: 'Yamada' }

  it('[正常系] 指定した言語の翻訳を返す', () => {
    // Arrange
    const translations = [ja, en]

    // Act
    const result = selectTranslation(translations, 'en')

    // Assert
    expect(result).toBe(en)
  })

  it('[正常系] 指定した言語がなければ ja を返す', () => {
    // Arrange
    const translations = [ja]

    // Act
    const result = selectTranslation(translations, 'en')

    // Assert
    expect(result).toBe(ja)
  })

  it('[異常系] どちらもなければ undefined を返す', () => {
    // Arrange
    const translations: (typeof ja)[] = []

    // Act
    const result = selectTranslation(translations, 'en')

    // Assert
    expect(result).toBeUndefined()
  })
})
