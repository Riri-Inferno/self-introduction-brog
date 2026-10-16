import { z } from 'zod'

// レスポンスの本文の形(ADR 0015)
//   成功: { data, meta? }
//   失敗: { error: { code, message, details?, requestId } }

/** 成功時の本文。ルートでは data の中身のスキーマだけを渡す */
export const dataResponse = <T extends z.ZodType>(data: T) => z.object({ data })

export const ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL_ERROR',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export const errorResponseSchema = z
  .object({
    error: z.object({
      code: z.enum(ERROR_CODES),
      message: z.string(),
      details: z
        .array(z.object({ path: z.string(), message: z.string() }))
        .optional(),
      requestId: z.string(),
    }),
  })
  .meta({ id: 'ErrorResponse' })

export type ErrorResponse = z.infer<typeof errorResponseSchema>
