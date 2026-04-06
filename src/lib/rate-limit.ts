import { Ratelimit } from '@upstash/ratelimit'
import { Redis }     from '@upstash/redis'

console.log('[rate-limit] Initializing Redis...')
console.log('[rate-limit] UPSTASH_REDIS_URL:', process.env.UPSTASH_REDIS_URL)
console.log('[rate-limit] UPSTASH_REDIS_TOKEN exists:', Boolean(process.env.UPSTASH_REDIS_TOKEN))

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
})

console.log('[rate-limit] Redis initialized')

// Authenticated users: 30 requests per minute
export const agentLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1 m'),
  prefix:  'curria:agent',
})

// Public routes (free analysis): 5 requests per minute per IP
export const publicLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  prefix:  'curria:public',
})
