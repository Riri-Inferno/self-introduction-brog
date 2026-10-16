import { DEFAULT_LOCALE, type Locale } from './locale.js'

/**
 * 翻訳の中から、指定した言語のものを選ぶ。
 * 指定した言語がなければ DEFAULT_LOCALE のものを返し、それもなければ undefined を返す。
 * 英訳していないデータでも、日本語で表示できるようにするため(ADR 0002)。
 */
export function selectTranslation<T extends { locale: Locale }>(
  translations: readonly T[],
  locale: Locale,
): T | undefined {
  return (
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === DEFAULT_LOCALE)
  )
}
