import type { NextRequest } from 'next/server'
import { z } from 'zod'

export const BodySchema = z.discriminatedUnion('scope', [
  z.object({
    scope: z.literal('base'),
    clientRequestId: z.string().min(1).max(200).optional(),
  }),
  z.object({
    scope: z.literal('target'),
    targetId: z.string().min(1),
    clientRequestId: z.string().min(1).max(200).optional(),
  }),
])

export function parseSessionGenerateBody(request: NextRequest) {
  return BodySchema.safeParse(request.json())
}

