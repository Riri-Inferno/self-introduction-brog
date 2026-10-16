import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import Fastify, { type FastifyInstance, type FastifyServerOptions } from 'fastify'
import {
  jsonSchemaTransform,
  jsonSchemaTransformObject,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { registerErrorHandlers } from './presentation/error-handler.js'
import { publicRoutes, type PublicUsecases } from './presentation/routes/public/index.js'

export interface AppDeps {
  usecases: PublicUsecases
  logger?: FastifyServerOptions['logger']
  /** true なら OpenAPI を作り、画面を /docs、定義を /docs/json に出す */
  docs?: boolean
}

/**
 * Fastify を組み立てる。listen はしない。
 * 依存は引数で受け取るので、テストではフェイクのユースケースを渡せる(ADR 0013, 0017)。
 */
export async function buildApp(deps: AppDeps) {
  const app = Fastify({ logger: deps.logger ?? false })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  registerErrorHandlers(app)

  // CORS、セキュリティヘッダー、認証(ADR 0012)など、全ルートにかける設定はここに足す
  // ルートより先に register する

  // OpenAPI は docs のときだけ作る。@fastify/swagger の読み込みに時間がかかり、テストが遅くなるため
  if (deps.docs) {
    await registerDocs(app)
  }

  await app.register(publicRoutes(deps.usecases), { prefix: '/api/public' })

  return app
}

async function registerDocs(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: { title: 'self-introduce API', version: '0.1.0' },
      tags: [
        { name: 'public', description: '閲覧用。認証なし' },
        { name: 'admin', description: '管理用。認証が必要' },
      ],
    },
    transform: jsonSchemaTransform,
    transformObject: jsonSchemaTransformObject,
  })
  await app.register(swaggerUi, { routePrefix: '/docs' })
}
