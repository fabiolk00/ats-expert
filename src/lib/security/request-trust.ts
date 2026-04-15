import type { NextRequest } from 'next/server'

import { getAppOrigin } from '@/lib/config/app-url'

export type TrustedMutationRejectionReason =
  | 'missing_trust_signal'
  | 'invalid_origin'
  | 'malformed_origin'

export type TrustedMutationValidationResult =
  | {
    ok: true
    signal: 'origin' | 'referer'
    trustedOrigin: string
  }
  | {
    ok: false
    signal: 'origin' | 'referer' | null
    reason: TrustedMutationRejectionReason
  }

function isLoopbackHost(hostname: string): boolean {
  return hostname === '127.0.0.1' || hostname === 'localhost'
}

function isAllowedOrigin(candidate: URL, request: NextRequest): boolean {
  const requestOrigin = request.nextUrl.origin
  const canonicalOrigin = getAppOrigin()

  if (candidate.origin === requestOrigin || candidate.origin === canonicalOrigin) {
    return true
  }

  return (
    candidate.protocol === request.nextUrl.protocol
    && candidate.port === request.nextUrl.port
    && isLoopbackHost(candidate.hostname)
    && isLoopbackHost(request.nextUrl.hostname)
  )
}

function validateHeaderOrigin(
  rawValue: string | null,
  signal: 'origin' | 'referer',
  request: NextRequest,
): TrustedMutationValidationResult | null {
  if (!rawValue) {
    return null
  }

  try {
    const candidate = new URL(rawValue)

    if (!isAllowedOrigin(candidate, request)) {
      return {
        ok: false,
        signal,
        reason: 'invalid_origin',
      }
    }

    return {
      ok: true,
      signal,
      trustedOrigin: candidate.origin,
    }
  } catch {
    return {
      ok: false,
      signal,
      reason: 'malformed_origin',
    }
  }
}

export function validateTrustedMutationRequest(
  request: NextRequest,
): TrustedMutationValidationResult {
  const originValidation = validateHeaderOrigin(request.headers.get('origin'), 'origin', request)
  if (originValidation) {
    return originValidation
  }

  const refererValidation = validateHeaderOrigin(request.headers.get('referer'), 'referer', request)
  if (refererValidation) {
    return refererValidation
  }

  return {
    ok: false,
    signal: null,
    reason: 'missing_trust_signal',
  }
}
