import { describe, expect, it } from 'vitest'
import { ConflictError, NotFoundError } from './errors.js'

// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

describe('NotFoundError', () => {
  it('[正常系] 対象の種類と id を持ち、文言に入れる', () => {
    // Arrange
    const target = { resource: 'Post', id: 'hello' }

    // Act
    const error = new NotFoundError(target)

    // Assert
    expect(error).toMatchObject({ resource: 'Post', id: 'hello', name: 'NotFoundError' })
    expect(error.message).toBe('Post (id: hello) が見つかりません')
  })

  it('[正常系] id を省略したら、種類だけを文言に入れる', () => {
    // Arrange
    const target = { resource: 'Profile' }

    // Act
    const error = new NotFoundError(target)

    // Assert
    expect(error.id).toBeUndefined()
    expect(error.message).toBe('Profile が見つかりません')
  })

  it('[正常系] message を指定したら、既定の文言の代わりに使う', () => {
    // Arrange
    const target = { resource: 'Profile', message: 'プロフィールが登録されていません' }

    // Act
    const error = new NotFoundError(target)

    // Assert
    expect(error.message).toBe('プロフィールが登録されていません')
    expect(error.resource).toBe('Profile')
  })
})

describe('ConflictError', () => {
  it('[正常系] 対象の種類と id を持ち、文言に入れる', () => {
    // Arrange
    const target = { resource: 'Skill', id: 'TypeScript' }

    // Act
    const error = new ConflictError(target)

    // Assert
    expect(error).toMatchObject({ resource: 'Skill', id: 'TypeScript', name: 'ConflictError' })
    expect(error.message).toBe('Skill (id: TypeScript) は今のデータと矛盾するため処理できません')
  })
})
