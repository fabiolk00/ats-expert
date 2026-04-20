import type { AppUser } from '@/types/user'

function parseEmails(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
}

export function canAccessOperationsDashboard(
  appUser: AppUser | null,
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (!appUser) {
    return false
  }

  const email = appUser.authIdentity.email?.trim().toLowerCase()
  if (!email) {
    return false
  }

  return parseEmails(env.OPERATIONS_DASHBOARD_EMAILS).includes(email)
}

