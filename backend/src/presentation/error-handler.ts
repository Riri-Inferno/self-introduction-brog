import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'
import { ConflictError, NotFoundError } from '../domain/errors.js'
import { ERROR_STATUS, type ErrorCode, type ErrorResponse } from './schemas/response.js'

// すべてのエラーを { error: { code, ... } } の形にして返す(ADR 0015)

/**
 * エラーのレスポンスを返す。
 * ステータスは code から決める(ERROR_STATUS)。既定と違うステータスを返すときだけ status を指定する。
 */
function sendError(
  reply: FastifyReply,
  request: FastifyRequest,
  code: ErrorCode,
  message: string,
  options: { details?: ErrorResponse['error']['details']; status?: number } = {},
) {
  const { details, status = ERROR_STATUS[code] } = options
  const body: ErrorResponse = {
    error: { code, message, ...(details && { details }), requestId: request.id },
  }
  return reply.code(status).send(body)
}

export function registerErrorHandlers(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request, reply) => {
    // リクエストが Zod のスキーマに合わない
    if (hasZodFastifySchemaValidationErrors(error)) {
      const details = error.validation.map((v) => ({
        // "/translations/0/locale" → "translations.0.locale"
        path: v.instancePath.split('/').filter(Boolean).join('.'),
        message: v.message ?? '',
      }))
      return sendError(reply, request, 'VALIDATION_ERROR', '入力内容に誤りがあります', { details })
    }

    // 業務上のエラー(domain/errors.ts)
    if (error instanceof NotFoundError) {
      return sendError(reply, request, 'NOT_FOUND', error.message)
    }
    if (error instanceof ConflictError) {
      return sendError(reply, request, 'CONFLICT', error.message)
    }

    // Fastify が返すリクエストのエラー(JSON の構文エラー、大きすぎる本文など)
    // 413 や 415 もあるので、ステータスは Fastify のものをそのまま使う
    if (error.statusCode !== undefined && error.statusCode >= 400 && error.statusCode < 500) {
      return sendError(reply, request, 'VALIDATION_ERROR', error.message, {
        status: error.statusCode,
      })
    }

    // 想定外のエラー。内部の情報は返さず、ログにだけ出す
    request.log.error({ err: error }, 'unhandled error')
    return sendError(reply, request, 'INTERNAL_ERROR', 'サーバーでエラーが発生しました')
  })

  app.setNotFoundHandler((request, reply) =>
    sendError(reply, request, 'NOT_FOUND', `${request.method} ${request.url} は存在しません`),
  )
}
