import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { Redis } from '@upstash/redis'

import {
  disableAppUserByClerkUserId,
  getOrCreateAppUserByClerkUserId,
  syncClerkUserProfile,
} from '@/lib/auth/app-user'

export const runtime = 'nodejs'

const TOLERANCE_SECONDS = 5 * 60
const IDEMPOTENCY_TTL = 24 * 60 * 60

let redisClient: Redis | null = null

function getRequiredClerkWebhookEnv(
  name: 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN' | 'CLERK_WEBHOOK_SECRET',
): string {
  const trimmed = process.env[name]?.trim()

  if (!trimmed) {
    throw new Error(`Missing required environment variable ${name} for Clerk webhook.`)
  }

  return trimmed
}

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: getRequiredClerkWebhookEnv('UPSTASH_REDIS_REST_URL'),
      token: getRequiredClerkWebhookEnv('UPSTASH_REDIS_REST_TOKEN'),
    })
  }

  return redisClient
}

export async function POST(req: Request): Promise<Response> {
  const headerPayload = headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  let redis: Redis
  let webhook: Webhook

  try {
    redis = getRedisClient()
    webhook = new Webhook(getRequiredClerkWebhookEnv('CLERK_WEBHOOK_SECRET'))
  } catch (error) {
    console.error('[webhook/clerk] Missing configuration:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Missing Clerk webhook configuration.' },
      { status: 500 },
    )
  }

  const eventTime = parseInt(svixTimestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - eventTime) > TOLERANCE_SECONDS) {
    console.warn(
      `[webhook/clerk] Rejected stale event ${svixId} (age: ${now - eventTime}s)`,
    )
    return Response.json(
      { error: 'Webhook timestamp out of tolerance' },
      { status: 400 },
    )
  }

  const idempotencyKey = `clerk:webhook:${svixId}`
  const setResult = await redis.set(idempotencyKey, '1', {
    ex: IDEMPOTENCY_TTL,
    nx: true,
  })

  if (setResult !== 'OK') {
    return Response.json({ ok: true, duplicate: true }, { status: 200 })
  }

  const body = await req.text()

  let evt: WebhookEvent
  try {
    evt = webhook.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (error) {
    console.error('[webhook/clerk] Signature verification failed:', error)
    await redis.del(idempotencyKey)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (evt.type) {
      case 'user.created': {
        const { id } = evt.data
        await getOrCreateAppUserByClerkUserId(id)
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = evt.data
        const email = email_addresses[0]?.email_address ?? null
        const emailVerifiedAt =
          email_addresses[0]?.verification?.status === 'verified'
            ? new Date().toISOString()
            : null
        const name = [first_name, last_name].filter(Boolean).join(' ') || null
        await syncClerkUserProfile({
          clerkUserId: id,
          email,
          displayName: name,
          emailVerifiedAt,
        })
        break
      }

      case 'user.deleted': {
        const { id } = evt.data
        if (!id) {
          break
        }

        await disableAppUserByClerkUserId(id)
        break
      }

      default:
        break
    }
  } catch (error) {
    console.error(`[webhook/clerk] Handler error for ${evt.type}:`, error)
    await redis.del(idempotencyKey)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 200 })
}
