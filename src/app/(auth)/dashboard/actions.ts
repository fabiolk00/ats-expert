'use server'

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db/sessions'

export async function createSession() {
  const { userId } = await auth()
  if (!userId) redirect('/login')

  const session = await db.createSession(userId)
  redirect(`/chat/${session.id}`)
}
