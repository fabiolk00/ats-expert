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
 * Checks if a URL looks like a job posting from known platforms.
 */
export function isJobPostingUrl(url: string): boolean {
  const jobPlatforms = [
    'linkedin.com/jobs',
    'linkedin.com/in',
    'gupy.io',
    'catho.com.br',
    'indeed.com',
    'glassdoor.com',
    'vagas.com.br',
    'infojobs.com.br',
    'trampos.co',
    'programathor.com.br',
    'getonbrd.com',
    'workana.com',
    'remotar.com.br',
    'lever.co',
    'greenhouse.io',
    'jobs.lever.co',
    'boards.greenhouse.io',
    'apply.workable.com',
  ]

  return jobPlatforms.some((platform) => url.toLowerCase().includes(platform))
}
