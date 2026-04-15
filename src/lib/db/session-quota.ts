export async function checkUserQuota(appUserId: string): Promise<boolean> {
  const { checkUserQuota } = await import('@/lib/asaas/quota')
  return checkUserQuota(appUserId)
}
