import { Webhook } from 'svix'
import { headers } from 'next/headers'
import type { WebhookEvent } from '@clerk/nextjs/server'
import { Redis } from '@upstash/redis'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const TOLERANCE_SECONDS = 5 * 60 // reject webhooks older than 5 minutes
const IDEMPOTENCY_TTL = 24 * 60 * 60 // deduplicate within 24 hours

export async function POST(req: Request): Promise<Response> {
  const headerPayload = headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // ── Replay protection: timestamp window ───────────────────────────────────
  const eventTime = parseInt(svixTimestamp, 10)
  const now = Math.floor(Date.now() / 1000)
  if (Math.abs(now - eventTime) > TOLERANCE_SECONDS) {
    console.warn(
      `[webhook/clerk] Rejected stale event ${svixId} (age: ${now - eventTime}s)`
    )
    return Response.json(
      { error: 'Webhook timestamp out of tolerance' },
      { status: 400 }
    )
  }

  // ── Replay protection: idempotency via Redis ──────────────────────────────
  const idempotencyKey = `clerk:webhook:${svixId}`
  const setResult = await redis.set(idempotencyKey, '1', {
    ex: IDEMPOTENCY_TTL,
    nx: true,
  })

  if (setResult !== 'OK') {
    console.log(`[webhook/clerk] Duplicate delivery ignored: ${svixId}`)
    return Response.json({ ok: true, duplicate: true }, { status: 200 })
  }

  // ── Signature verification ────────────────────────────────────────────────
  const body = await req.text()
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)

  let evt: WebhookEvent
  try {
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('[webhook/clerk] Signature verification failed:', err)
    await redis.del(idempotencyKey)
    return Response.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ── Event handlers ────────────────────────────────────────────────────────
  try {
    switch (evt.type) {
      case 'user.created': {
        const { id } = evt.data
        const { error } = await supabase.from('user_quotas').insert({
          user_id: id,
          plan: 'free',
          credits_remaining: 1,
          asaas_customer_id: null,
          asaas_subscription_id: null,
          renews_at: null,
        })
        if (error) throw error
        console.log(
          `[webhook/clerk] user.created: ${id} — quota bootstrapped (1 free credit)`
        )
        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = evt.data
        const email = email_addresses[0]?.email_address ?? null
        const name =
          [first_name, last_name].filter(Boolean).join(' ') || null
        console.log(
          `[webhook/clerk] user.updated: ${id} (email: ${email}, name: ${name})`
        )
        break
      }

      case 'user.deleted': {
        const { id } = evt.data
        if (!id) break
        const { error } = await supabase
          .from('user_quotas')
          .delete()
          .eq('user_id', id)
        if (error) throw error
        console.log(
          `[webhook/clerk] user.deleted: ${id} — quota row removed`
        )
        break
      }

      default:
        break
    }
  } catch (err) {
    console.error(`[webhook/clerk] Handler error for ${evt.type}:`, err)
    await redis.del(idempotencyKey)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }

  return Response.json({ ok: true }, { status: 200 })
}
