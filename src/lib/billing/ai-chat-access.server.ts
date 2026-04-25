import 'server-only'

import { getUserBillingMetadata } from '@/lib/asaas/quota'

import {
  resolveAiChatAccessFromBillingMetadata,
  type AiChatAccessDecision,
} from '@/lib/billing/ai-chat-access'

export async function getAiChatAccess(
  appUserId: string,
  options?: { now?: Date },
): Promise<AiChatAccessDecision> {
  try {
    const metadata = await getUserBillingMetadata(appUserId)
    return resolveAiChatAccessFromBillingMetadata(metadata, {
      now: options?.now,
    })
  } catch {
    return resolveAiChatAccessFromBillingMetadata(null, {
      billingMetadataUnavailable: true,
      now: options?.now,
    })
  }
}
