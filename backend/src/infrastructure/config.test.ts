import { describe, expect, it } from 'vitest'
import { ConfigError, loadConfig } from './config.js'

// 各テストは Arrange(準備)/ Act(実行)/ Assert(確認)の3つに分けて書く

const DATABASE_URL = 'postgresql://app:app@localhost:5432/self_introduce'

describe('loadConfig', () => {
  it('[正常系] 任意の項目が未設定なら初期値を使う', () => {
    // Arrange
    const env = { DATABASE_URL }

    // Act
    const config = loadConfig(env)

    // Assert
    expect(config).toEqual({
      databaseUrl: DATABASE_URL,
      nodeEnv: 'development',
      host: '127.0.0.1',
      port: 3000,
      logLevel: 'info',
      storage: { dir: '.storage', baseUrl: 'http://localhost:3000/storage' },
    })
  })

  it('[正常系] 空の値は未設定として扱う', () => {
    // Arrange
    const env = { DATABASE_URL, PORT: '', STORAGE_BASE_URL: '' }

    // Act
    const config = loadConfig(env)

    // Assert
    expect(config.port).toBe(3000)
    expect(config.storage.baseUrl).toBe('http://localhost:3000/storage')
  })

  it('[正常系] 設定した値を使う。PORT は数値に変換する', () => {
    // Arrange
    const env = { DATABASE_URL, PORT: '8080', NODE_ENV: 'production' }

    // Act
    const config = loadConfig(env)

    // Assert
    expect(config.port).toBe(8080)
    expect(config.nodeEnv).toBe('production')
    expect(config.storage.baseUrl).toBe('http://localhost:8080/storage')
  })

  it('[異常系] DATABASE_URL がなければ ConfigError を投げる', () => {
    // Arrange
    const env = {}

    // Act
    const act = () => loadConfig(env)

    // Assert
    expect(act).toThrow(ConfigError)
  })

  it('[異常系] 誤りをすべて報告する', () => {
    // Arrange
    const env = { PORT: 'abc', NODE_ENV: 'prod' }

    // Act
    const act = () => loadConfig(env)

    // Assert
    expect(act).toThrow(/DATABASE_URL[\s\S]*NODE_ENV[\s\S]*PORT/)
  })
})
