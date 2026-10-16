import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { GetPublicProfile } from '../../../application/profile/get-public-profile.js'
import { LOCALES } from '../../../domain/locale.js'
import { localeQuerySchema } from '../../schemas/common.js'
import { dataResponse, errorResponseSchema } from '../../schemas/response.js'

// GET /api/public/profile
// このスキーマから、リクエストの検証、型、OpenAPI が作られる(ADR 0014)
// スキーマにないフィールドはレスポンスに出ない

const publicProfileSchema = z
  .object({
    locale: z.enum(LOCALES).describe('実際に返した言語。翻訳がなければ ja'),
    name: z.string(),
    nameKana: z.string().nullable(),
    title: z.string().nullable(),
    summary: z.string().nullable(),
    selfPr: z.string().nullable().describe('Markdown'),
    avatarUrl: z.url().nullable(),
    updatedAt: z.iso.datetime().describe('最終更新日時(UTC)'),
  })
  .meta({ id: 'PublicProfile' })

export function publicProfileRoutes(deps: {
  getPublicProfile: GetPublicProfile
}): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/profile',
      {
        schema: {
          tags: ['public'],
          summary: 'プロフィールを取得する',
          querystring: localeQuerySchema,
          response: {
            200: dataResponse(publicProfileSchema),
            400: errorResponseSchema,
            404: errorResponseSchema,
          },
        },
      },
      async (request) => {
        const profile = await deps.getPublicProfile({ locale: request.query.locale })
        return {
          data: { ...profile, updatedAt: profile.updatedAt.toISOString() },
        }
      },
    )
  }
}
