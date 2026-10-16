import type { Locale } from '../../domain/locale.js'

// 閲覧用 API の読み取りに使うインターフェース(ADR 0013)
// 実装は infrastructure/prisma にある。ユースケースのテストではフェイクを渡す

export interface ProfileTextRecord {
  locale: Locale
  name: string
  nameKana: string | null
  title: string | null
  summary: string | null
  selfPr: string | null
}

export interface PublicProfileRecord {
  avatarKey: string | null
  updatedAt: Date
  /** 引数で指定した言語の翻訳だけが入る */
  translations: ProfileTextRecord[]
}

export interface PublicProfileQuery {
  /** プロフィールがまだ登録されていなければ null を返す */
  find(locales: readonly Locale[]): Promise<PublicProfileRecord | null>
}
