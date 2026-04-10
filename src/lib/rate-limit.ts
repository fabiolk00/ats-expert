import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

type RateLimiter = Pick<Ratelimit, 'limit'>

let redisClient: Redis | null = null
let agentRatelimit: Ratelimit | null = null
let publicRatelimit: Ratelimit | null = null
let webhookRatelimit: Ratelimit | null = null

function getRequiredRedisEnv(
  name: 'UPSTASH_REDIS_REST_URL' | 'UPSTASH_REDIS_REST_TOKEN',
): string {
  const trimmed = process.env[name]?.trim()

  if (!trimmed) {
    throw new Error(`Missing required environment variable ${name} for rate limiter.`)
  }

  return trimmed
}

function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      url: getRequiredRedisEnv('UPSTASH_REDIS_REST_URL'),
      token: getRequiredRedisEnv('UPSTASH_REDIS_REST_TOKEN'),
    })
  }

  return redisClient
}

function getAgentRatelimit(): Ratelimit {
  if (!agentRatelimit) {
    agentRatelimit = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(30, '1 m'),
      prefix: 'curria:agent',
    })
  }

  return agentRatelimit
}

function getPublicRatelimit(): Ratelimit {
  if (!publicRatelimit) {
    publicRatelimit = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(5, '1 m'),
      prefix: 'curria:public',
    })
  }

  return publicRatelimit
}

function getWebhookRatelimit(): Ratelimit {
  if (!webhookRatelimit) {
    webhookRatelimit = new Ratelimit({
      redis: getRedisClient(),
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      prefix: 'curria:webhook',
    })
  }

  return webhookRatelimit
}

// Authenticated users: 30 requests per minute
export const agentLimiter: RateLimiter = {
  limit: (...args) => getAgentRatelimit().limit(...args),
}

// Public routes (free analysis): 5 requests per minute per IP
export const publicLimiter: RateLimiter = {
  limit: (...args) => getPublicRatelimit().limit(...args),
}

// Webhook security: 100 webhook deliveries per minute per token
// Protects against token brute-force and replay attacks
export const webhookLimiter: RateLimiter = {
  limit: (...args) => getWebhookRatelimit().limit(...args),
}
