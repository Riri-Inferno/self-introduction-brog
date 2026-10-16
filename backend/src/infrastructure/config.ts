import { z } from 'zod'

// 環境変数を読んで検証する(ADR 0016)
// process.env を読むのはここだけにする。項目を足したら .env.example と ADR 0016 の表も直す

/** `PORT=` のような空の値は、未設定として扱う */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema)

const envSchema = z.object({
  DATABASE_URL: optional(z.url()),
  NODE_ENV: optional(z.enum(['development', 'test', 'production']).default('development')),
  HOST: optional(z.string().default('127.0.0.1')),
  PORT: optional(z.coerce.number().int().min(1).max(65535).default(3000)),
  LOG_LEVEL: optional(
    z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  ),
  STORAGE_DIR: optional(z.string().default('.storage')),
  /** 未設定なら http://localhost:<PORT>/storage */
  STORAGE_BASE_URL: optional(z.url().optional()),
})

export interface Config {
  databaseUrl: string
  nodeEnv: 'development' | 'test' | 'production'
  host: string
  port: number
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent'
  storage: {
    dir: string
    baseUrl: string
  }
}

export class ConfigError extends Error {}

/**
 * 環境変数を検証して、型の付いた設定を返す。
 * 誤りがあれば、すべての誤りをまとめた ConfigError を投げる。
 */
export function loadConfig(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    throw new ConfigError(`環境変数に誤りがあります\n${z.prettifyError(result.error)}`)
  }

  const e = result.data
  return {
    databaseUrl: e.DATABASE_URL,
    nodeEnv: e.NODE_ENV,
    host: e.HOST,
    port: e.PORT,
    logLevel: e.LOG_LEVEL,
    storage: {
      dir: e.STORAGE_DIR,
      baseUrl: e.STORAGE_BASE_URL ?? `http://localhost:${e.PORT}/storage`,
    },
  }
}
