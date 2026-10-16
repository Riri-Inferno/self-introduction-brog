import type { Locale } from '../../domain/locale.js'

// 閲覧用 API の読み取りに使うインターフェース
// スキルでしか使わないので、ports/ ではなくこのフォルダに置く
// 実装は infrastructure/prisma にある。ユースケースのテストではフェイクを渡す

/** カテゴリ名の翻訳 */
export interface SkillCategoryTextRecord {
    locale: Locale
    name: string
}

export interface PublicSkillRecord {
    id: number
    name: string
    isFeatured: boolean
}

export interface PublicSkillCategoryRecord {
    id: number
    /**引数で指定した言語の翻訳のみ */
    translations: SkillCategoryTextRecord[]
    /** sortOrderの順に並ぶ */
    skills: PublicSkillRecord[]
}

export interface PublicSkillQuery {
    /** カテゴリをsortOderの順に返す。一件もなければ空配列を返す */
    findAll(locales: readonly Locale[]): Promise<PublicSkillCategoryRecord[]>
}
