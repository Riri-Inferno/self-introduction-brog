import { DEFAULT_LOCALE, type Locale } from '../../domain/locale.js'
import { selectTranslation } from '../../domain/translation.js'
import type { PublicSkillQuery } from './public-skill-query.js'

/** 閲覧画面に出すスキル */
export interface PublicSkill {
  id: number
  name: string
  isFeatured: boolean
}

/** 閲覧画面に出すスキルのカテゴリ */
export interface PublicSkillCategory {
  id: number
  /** 実際に返した言語。翻訳がなければ DEFAULT_LOCALE になる */
  locale: Locale
  name: string
  skills: PublicSkill[]
}

export type GetPublicSkills = (input: { locale: Locale }) => Promise<PublicSkillCategory[]>

/**
 * 閲覧用のスキル一覧を、カテゴリごとにまとめて取得するユースケース。
 * 依存は引数で受け取る(ADR 0013)。組み立ては main.ts で行う。
 * 一覧なので、1件もなければエラーにせず空の配列を返す。
 */
export function createGetPublicSkills(deps: { skillQuery: PublicSkillQuery }): GetPublicSkills {
  return async ({ locale }) => {
    const categories = await deps.skillQuery.findAll([locale, DEFAULT_LOCALE])

    const result: PublicSkillCategory[] = []
    for (const category of categories) {
      // スキルが 0 件のカテゴリは出さない
      if (category.skills.length === 0) continue

      // カテゴリ名の翻訳が ja にもなければ、そのカテゴリだけ出さない
      const text = selectTranslation(category.translations, locale)
      if (!text) continue

      result.push({
        id: category.id,
        locale: text.locale,
        name: text.name,
        skills: category.skills.map((skill) => ({
          id: skill.id,
          name: skill.name,
          isFeatured: skill.isFeatured,
        })),
      })
    }
    return result
  }
}
