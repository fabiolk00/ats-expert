"use client"

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackAnalyticsEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !window.gtag) {
    return
  }

  window.gtag("event", eventName, params ?? {})
}
