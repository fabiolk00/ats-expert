'use client'

import { useCallback, useEffect, useState } from 'react'

import { getSessionWorkspace } from '@/lib/dashboard/workspace-client'
import type { SessionWorkspace } from '@/types/dashboard'
import type { CVState } from '@/types/cv'

type SessionCvStateScope = 'base' | 'optimized' | 'target'

function selectCvStateFromWorkspace(
  workspace: SessionWorkspace,
  params?: {
    targetId?: string | null
    scope?: SessionCvStateScope
  },
): CVState {
  if (params?.scope === 'optimized') {
    if (!workspace.session.agentState.optimizedCvState) {
      throw new Error('Optimized resume not found for this session.')
    }

    return workspace.session.agentState.optimizedCvState
  }

  if (params?.scope !== 'target') {
    return workspace.session.cvState
  }

  const target = workspace.targets.find((entry) => entry.id === params.targetId)
  if (!target) {
    throw new Error('Target resume not found.')
  }

  return target.derivedCvState
}

type UseSessionCvStateResult = {
  cvState: CVState | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useSessionCvState(
  sessionId: string,
  params?: {
    targetId?: string | null
    scope?: SessionCvStateScope
  },
): UseSessionCvStateResult {
  const [cvState, setCvState] = useState<CVState | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const targetId = params?.targetId ?? null
  const scope = params?.scope ?? 'base'

  const refetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const workspace = await getSessionWorkspace(sessionId)
      setCvState(structuredClone(selectCvStateFromWorkspace(workspace, { targetId, scope })))
    } catch (fetchError) {
      setCvState(null)
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Não foi possível carregar o currículo.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [scope, sessionId, targetId])

  useEffect(() => {
    void refetch()
  }, [refetch])

  return { cvState, isLoading, error, refetch }
}
