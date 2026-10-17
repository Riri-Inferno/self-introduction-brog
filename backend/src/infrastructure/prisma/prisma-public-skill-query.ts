import type { PublicSkillQuery } from '../../application/skill/public-skill-query.js'
import { isLocale } from '../../domain/locale.js'
import type { PrismaClient } from './client.js'

export function createPrismaPublicSkillQuery(prisma: PrismaClient): PublicSkillQuery {
  return {
    async findAll(locales) {
      const categories = await prisma.skillCategory.findMany({
        orderBy: [
          { sortOrder: 'asc' },
          { id: 'asc' }
        ],
        select: {
          id: true,
          translations: {
            // 指定した言語の翻訳だけを取る(SQL の WHERE locale IN (...))
            // Prisma の in は readonly の配列を受け取れないので、コピーして渡す
            where: { locale: { in: [...locales] } },
            select: {
              locale: true,
              name: true,
            },
          },
          skills: {
            orderBy: [
              { sortOrder: 'asc' },
              { id: 'asc' }
            ],
            select: {
              id: true,
              name: true,
              isFeatured: true,
            },
          },
        },
      })

      // DB の locale は string なので、Locale 型に絞る。CHECK 制約があるので、実際には除外されない
      // メモ: flatMap で、条件に合わないものは [] を返して消す
      return categories.map((category) => ({
        ...category,
        translations: category.translations.flatMap(({ locale, ...text }) =>
          isLocale(locale) ? [{ locale, ...text }] : [],
        ),
      }))
    },
  }
}
