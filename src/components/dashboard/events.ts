"use client"

export const NEW_CONVERSATION_EVENT = "curria:new-conversation"
export const SESSION_SYNC_EVENT = "curria:session-sync"
export const ARTIFACT_REFRESH_EVENT = "curria:artifact-refresh"

export type SessionSyncDetail = {
  sessionId: string | null
}

export type ArtifactRefreshDetail = {
  sessionId: string
  targetId?: string | null
}
