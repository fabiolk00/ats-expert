import { redirect } from 'next/navigation'

/**
 * Legacy compatibility redirect.
 * The canonical profile setup flow is now at /dashboard/resumes/new
 * This route exists for backward compatibility and old bookmarks.
 */
export default async function ProfilePage() {
  redirect('/dashboard/resumes/new')
}
