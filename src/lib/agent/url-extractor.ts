/**
 * Extracts the first URL found in a text string.
 * Returns null if no URL is found.
 */
export function extractUrl(text: string): string | null {
  const urlPattern = /https?:\/\/[^\s<>"{}|\\^`\[\]]+/i
  const match = text.match(urlPattern)
  return match ? match[0] : null
}

/**
 * Known job platforms expressed as { host, pathPrefix? } pairs.
 * The host is matched against the URL's hostname (exact or subdomain).
 * The optional pathPrefix requires the URL path to start with the given prefix.
 */
const JOB_PLATFORMS: Array<{ host: string; pathPrefix?: string }> = [
  { host: 'linkedin.com', pathPrefix: '/jobs' },
  { host: 'gupy.io' },
  { host: 'catho.com.br' },
  { host: 'indeed.com' },
  { host: 'glassdoor.com' },
  { host: 'vagas.com.br' },
  { host: 'infojobs.com.br' },
  { host: 'trampos.co' },
  { host: 'programathor.com.br' },
  { host: 'getonbrd.com' },
  { host: 'workana.com' },
  { host: 'remotar.com.br' },
  { host: 'lever.co' },
  { host: 'greenhouse.io' },
  { host: 'jobs.lever.co' },
  { host: 'boards.greenhouse.io' },
  { host: 'apply.workable.com' },
]

/**
 * Checks if a URL belongs to a known job posting platform.
 * Uses strict hostname + pathname prefix matching to prevent
 * URL bypass via path injection (e.g. `https://evil.com/linkedin.com/jobs/fake`).
 */
export function isJobPostingUrl(url: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return false
  }

  const hostname = parsed.hostname.toLowerCase()
  const pathname = parsed.pathname.toLowerCase()

  return JOB_PLATFORMS.some((platform) => {
    const hostMatch =
      hostname === platform.host || hostname.endsWith('.' + platform.host)

    if (!hostMatch) return false

    if (platform.pathPrefix) {
      return pathname.startsWith(platform.pathPrefix)
    }

    return true
  })
}
