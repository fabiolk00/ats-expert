import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { getAppUrl, isCanonicalAppHost } from '@/lib/config/app-url'

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/pricing(.*)',
  '/what-is-ats(.*)',
  '/sso-callback(.*)',
  '/api/webhook/asaas(.*)',
  '/api/webhook/clerk(.*)',
])

function decodeClerkFrontendApi(): string | null {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim()
  if (!publishableKey) {
    return null
  }

  const [, encodedPart = ''] = publishableKey.split('_', 3)
  if (!encodedPart) {
    return null
  }

  try {
    const normalizedBase64 = encodedPart.replace(/-/g, '+').replace(/_/g, '/')
    const paddedBase64 = normalizedBase64.padEnd(Math.ceil(normalizedBase64.length / 4) * 4, '=')
    const decoded = atob(paddedBase64).replace(/\$/g, '').trim()
    if (!decoded) {
      return null
    }

    return decoded.startsWith('http://') || decoded.startsWith('https://')
      ? decoded
      : `https://${decoded}`
  } catch {
    return null
  }
}

/**
 * Security headers applied to all responses.
 * See: OWASP, ARCHITECTURE_REVIEW.md
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  const clerkFrontendApi = decodeClerkFrontendApi()
  const clerkScriptSrc = [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    clerkFrontendApi,
    'https://challenges.cloudflare.com',
  ].filter(Boolean).join(' ')

  const clerkConnectSrc = [
    "'self'",
    clerkFrontendApi,
    'https:',
  ].filter(Boolean).join(' ')

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Enforce HTTPS (1 year, include subdomains)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload',
  )

  // Content Security Policy: restrict to self + necessary third-party services
  // Self: allows same-origin resources
  // unsafe-inline: required for Next.js inline scripts (minimal attack surface in SSR context)
  // cdn.jsdelivr.net: for external CDN assets if used
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${clerkScriptSrc}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      `connect-src ${clerkConnectSrc}`,
      "worker-src 'self' blob:",
      "frame-src 'self' https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join('; ') + ';',
  )

  return response
}

function shouldRedirectToCanonicalHost(req: NextRequest): boolean {
  const pathname = req.nextUrl.pathname
  if (pathname.startsWith('/api/webhook/')) {
    return false
  }

  const hostname = req.nextUrl.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.vercel.app')) {
    return false
  }

  if (!hostname.endsWith('curria.com.br')) {
    return false
  }

  return !isCanonicalAppHost(hostname)
}

export default clerkMiddleware((auth, req) => {
  if (shouldRedirectToCanonicalHost(req)) {
    const canonical = getAppUrl()
    const redirectUrl = new URL(req.nextUrl.pathname + req.nextUrl.search, canonical)
    return NextResponse.redirect(redirectUrl, 308)
  }

  // API routes handle their own auth and should not redirect
  const isApiRoute = req.nextUrl.pathname.startsWith('/api/')

  if (!isPublicRoute(req) && !isApiRoute) {
    auth().protect()
  }

  // Create a response to wrap with security headers
  const response = NextResponse.next()
  return addSecurityHeaders(response)
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
