import { redirect } from 'next/navigation'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import DashboardShell from '@/components/dashboard/dashboard-shell'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const appUser = await getCurrentAppUser()
  if (!appUser) redirect('/login')

  return <DashboardShell>{children}</DashboardShell>
}
