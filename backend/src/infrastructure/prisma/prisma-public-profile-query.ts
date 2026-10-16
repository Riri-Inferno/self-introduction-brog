import type { PublicProfileQuery } from '../../application/profile/public-profile-query.js'
import { isLocale } from '../../domain/locale.js'
import type { PrismaClient } from './client.js'

/** Profile の id は常に 1(Profile_id_singleton_check) */
const PROFILE_ID = 1

export function createPrismaPublicProfileQuery(prisma: PrismaClient): PublicProfileQuery {
  return {
    async find(locales) {
      const profile = await prisma.profile.findUnique({
        where: { id: PROFILE_ID },
        select: {
          avatarKey: true,
          updatedAt: true,
          translations: {
            where: { locale: { in: [...locales] } },
            select: {
              locale: true,
              name: true,
              nameKana: true,
              title: true,
              summary: true,
              selfPr: true,
            },
          },
        },
      })
      if (!profile) return null

      // DB の locale は string なので、Locale 型に絞る。CHECK 制約があるので、実際には除外されない
      return {
        ...profile,
        translations: profile.translations.flatMap(({ locale, ...text }) =>
          isLocale(locale) ? [{ locale, ...text }] : [],
        ),
      }
    },
  }
}
