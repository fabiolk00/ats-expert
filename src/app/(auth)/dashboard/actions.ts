'use server'

import { redirect } from 'next/navigation'
import { getCurrentAppUser } from '@/lib/auth/app-user'
import { db } from '@/lib/db/sessions'

export async function createSession() {
  const appUser = await getCurrentAppUser()
  if (!appUser) redirect('/login')

  const session = await db.createSession(appUser.id)
  redirect(`/chat/${session.id}`)
}
