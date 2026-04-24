import { redirect } from 'next/navigation'

import { PROFILE_SETUP_PATH } from '@/lib/routes/app'

/**
 * Legacy compatibility redirect.
 * The canonical profile setup flow is now at /profile-setup
 * This route exists for backward compatibility and old bookmarks.
 */
export default async function ProfilePage() {
  redirect(PROFILE_SETUP_PATH)
}
