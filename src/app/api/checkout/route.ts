import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { createCheckoutLink } from '@/lib/asaas/checkout'

const BodySchema = z.object({
  plan: z.enum(['one_time', 'monthly', 'pro']),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = BodySchema.safeParse(await req.json())
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 400 })

  try {
    const user = await currentUser()
    const userName = user?.fullName ?? user?.firstName ?? 'Usuário'
    const userEmail = user?.emailAddresses[0]?.emailAddress ?? ''
    const origin = req.headers.get('origin') ?? 'http://localhost:3000'
    const successUrl = `${origin}/dashboard`

    const url = await createCheckoutLink({
      userId,
      userName,
      userEmail,
      plan: body.data.plan,
      successUrl,
    })

    return NextResponse.json({ url })
  } catch (err) {
    console.error('[api/checkout]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
