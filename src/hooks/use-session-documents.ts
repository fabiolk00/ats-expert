'use client'

import { useCallback, useEffect, useState } from 'react'

import { getDownloadUrls, listTargets, listVersions } from '@/lib/dashboard/workspace-client'
import type { SerializedResumeTarget, SerializedTimelineEntry } from '@/types/dashboard'

type SessionFiles = {
  docxUrl: string | null
  pdfUrl: string | null
}

type SessionDocuments = {
  versions: SerializedTimelineEntry[]
  targets: SerializedResumeTarget[]
  files: SessionFiles
  isLoading: boolean
  error: string | null
  refresh: () => void
}

export function useSessionDocuments(sessionId: string | null): SessionDocuments {
  const [versions, setVersions] = useState<SerializedTimelineEntry[]>([])
  const [targets, setTargets] = useState<SerializedResumeTarget[]>([])
  const [files, setFiles] = useState<SessionFiles>({ docxUrl: null, pdfUrl: null })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const refresh = useCallback(() => {
    setRefreshTick((previous) => previous + 1)
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setVersions([])
      setTargets([])
      setFiles({ docxUrl: null, pdfUrl: null })
      setError(null)
      setIsLoading(false)
      return
    }

    let isCancelled = false

    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [nextVersions, nextTargets, nextFiles] = await Promise.all([
          listVersions(sessionId),
          listTargets(sessionId),
          getDownloadUrls(sessionId).catch(() => ({ docxUrl: null, pdfUrl: null })),
        ])

        if (isCancelled) {
          return
        }

        setVersions(nextVersions)
        setTargets(nextTargets)
        setFiles({
          docxUrl: nextFiles.docxUrl ?? null,
          pdfUrl: nextFiles.pdfUrl ?? null,
        })
      } catch (fetchError) {
        if (!isCancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'Não foi possível carregar os documentos da sessão.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      isCancelled = true
    }
  }, [refreshTick, sessionId])

  useEffect(() => {
    if (!sessionId) {
      return
    }

    const interval = window.setInterval(refresh, 10_000)
    return () => window.clearInterval(interval)
  }, [refresh, sessionId])

  return { versions, targets, files, isLoading, error, refresh }
}
