export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = '/dashboard',
): string {
  if (!candidate) {
    return fallback
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback
  }

  return candidate
}

export function buildClerkFallbackLoginPath(
  redirectTo: string,
  status?: string | null,
): string {
  const params = new URLSearchParams()

  if (redirectTo) {
    params.set('redirect_to', redirectTo)
  }

  if (status) {
    params.set('status', status)
  }

  const query = params.toString()
  return query ? `/login/clerk?${query}` : '/login/clerk'
}
