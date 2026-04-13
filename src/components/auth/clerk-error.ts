type ClerkErrorShape = {
  errors?: Array<{
    longMessage?: string
    message?: string
    code?: string
  }>
}

export function getClerkErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const clerkErrors =
    error &&
    typeof error === "object" &&
    "errors" in error &&
    Array.isArray((error as ClerkErrorShape).errors)
      ? (error as ClerkErrorShape).errors
      : null

  if (clerkErrors && clerkErrors.length > 0) {
    const firstError = clerkErrors[0]

    return firstError?.longMessage || firstError?.message || fallback
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}
