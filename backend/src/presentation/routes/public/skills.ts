import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import type { GetPublicSkills } from '../../../application/skill/get-public-skills.js'
import { LOCALES } from '../../../domain/locale.js'
import { localeQuerySchema } from '../../schemas/common.js'
import { dataResponse, errorResponseSchema } from '../../schemas/response.js'

// GET /api/public/skills
// このスキーマから、リクエストの検証、型、OpenAPI が作られる(ADR 0014)
// スキーマにないフィールドはレスポンスに出ない

const publicSkillSchema = z.object({
  id: z.number(),
  name: z.string(),
  isFeatured: z.boolean().describe('主要スキルか。見せ方はフロントで決める'),
})

const publicSkillCategorySchema = z.object({
  id: z.number(),
  locale: z.enum(LOCALES).describe('実際に返した言語。翻訳がなければ ja'),
  name: z.string(),
  skills: z.array(publicSkillSchema),
})

const publicSkillsSchema = z
  .object({
    categories: z.array(publicSkillCategorySchema),
  })
  .meta({ id: 'PublicSkills' })

export function publicSkillRoutes(deps: {
  getPublicSkills: GetPublicSkills
}): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/skills',
      {
        schema: {
          tags: ['public'],
          summary: 'スキル一覧を取得する',
          querystring: localeQuerySchema,
          response: {
            200: dataResponse(publicSkillsSchema),
            400: errorResponseSchema,
          },
        },
      },
      async (request) => {
        const categories = await deps.getPublicSkills({ locale: request.query.locale })
        return { data: { categories } }
      },
    )
  }
}
