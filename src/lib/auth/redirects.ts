import { PROFILE_SETUP_PATH, canonicalizeAppPath } from "@/lib/routes/app"

export function getSafeRedirectPath(
  candidate: string | null | undefined,
  fallback = PROFILE_SETUP_PATH,
): string {
  if (!candidate) {
    return fallback
  }

  if (!candidate.startsWith('/') || candidate.startsWith('//')) {
    return fallback
  }

  return canonicalizeAppPath(candidate)
}
