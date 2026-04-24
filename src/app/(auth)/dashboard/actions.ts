'use server'

import { redirect } from 'next/navigation'

import { PROFILE_SETUP_PATH } from '@/lib/routes/app'

export async function createSession() {
  redirect(PROFILE_SETUP_PATH)
}
