import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { GetPublicProfile } from '../../../application/profile/get-public-profile.js'
import { publicProfileRoutes } from './profile.js'

// /api/public 以下のルート。GET だけを登録する(ADR 0012)
// ルートを足したら、使うユースケースを PublicUsecases に足して register する

export interface PublicUsecases {
  getPublicProfile: GetPublicProfile
}

export function publicRoutes(usecases: PublicUsecases): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(publicProfileRoutes(usecases))
  }
}
