// Zod のスキーマを置くファイル

import { z } from 'zod'
import { DEFAULT_LOCALE, LOCALES } from '../../domain/locale.js'

/** 閲覧用 API の ?locale=ja|en。省略したら DEFAULT_LOCALE */
export const localeQuerySchema = z.object({
  locale: z.enum(LOCALES).default(DEFAULT_LOCALE),
})
