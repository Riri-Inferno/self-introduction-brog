// 言語コード。翻訳テーブルの locale と同じ値を使う(ADR 0002)

export const LOCALES = ['ja', 'en'] as const

export type Locale = (typeof LOCALES)[number]

/** 翻訳がないときに代わりに使う言語 */
export const DEFAULT_LOCALE: Locale = 'ja'

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
