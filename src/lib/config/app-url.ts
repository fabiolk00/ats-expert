function normalizeUrl(value: string | undefined, fallback: string): URL {
  const rawValue = value?.trim() || fallback

  try {
    return new URL(rawValue)
  } catch {
    return new URL(fallback)
  }
}

export function getAppUrl(): URL {
  return normalizeUrl(
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXT_PUBLIC_BASE_URL || 'https://www.curria.com.br',
  )
}

export function getAppOrigin(): string {
  return getAppUrl().origin
}

export function isCanonicalAppHost(hostname: string): boolean {
  return hostname === getAppUrl().hostname
}
