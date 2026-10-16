import { NotFoundError } from '../../domain/errors.js'
import { DEFAULT_LOCALE, type Locale } from '../../domain/locale.js'
import { selectTranslation } from '../../domain/translation.js'
import type { ImageStorage } from '../ports/image-storage.js'
import type { PublicProfileQuery } from './public-profile-query.js'

/** 閲覧画面に出すプロフィール */
export interface PublicProfile {
  /** 実際に返した言語。翻訳がなければ DEFAULT_LOCALE になる */
  locale: Locale
  name: string
  nameKana: string | null
  title: string | null
  summary: string | null
  selfPr: string | null
  avatarUrl: string | null
  updatedAt: Date
}

export type GetPublicProfile = (input: { locale: Locale }) => Promise<PublicProfile>

/**
 * 閲覧用のプロフィールを取得するユースケース。
 * 依存は引数で受け取る(ADR 0013)。組み立ては main.ts で行う。
 */
export function createGetPublicProfile(deps: {
  profileQuery: PublicProfileQuery
  imageStorage: ImageStorage
}): GetPublicProfile {
  return async ({ locale }) => {
    const profile = await deps.profileQuery.find([locale, DEFAULT_LOCALE])
    const text = profile && selectTranslation(profile.translations, locale)
    if (!profile || !text) {
      throw new NotFoundError({ resource: 'Profile', message: 'プロフィールが登録されていません' })
    }

    return {
      ...text,
      avatarUrl: profile.avatarKey ? deps.imageStorage.url(profile.avatarKey) : null,
      updatedAt: profile.updatedAt,
    }
  }
}
