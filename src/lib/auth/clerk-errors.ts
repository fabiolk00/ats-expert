function readPrimaryClerkError(error: unknown): { code?: string; message?: string } | null {
  if (!error || typeof error !== 'object') {
    return null
  }

  const errors = (error as { errors?: Array<{ code?: string; message?: string }> }).errors
  if (!Array.isArray(errors) || errors.length === 0) {
    return null
  }

  return errors[0] ?? null
}

export function getClerkErrorMessage(error: unknown, fallback: string): string {
  return readPrimaryClerkError(error)?.message ?? fallback
}

export function isSessionAlreadyExistsError(error: unknown): boolean {
  const clerkError = readPrimaryClerkError(error)
  if (!clerkError) {
    return false
  }

  if (clerkError.code === 'session_exists') {
    return true
  }

  return clerkError.message?.toLowerCase().includes('session already exists') ?? false
}
