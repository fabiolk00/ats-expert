'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Loader2, Linkedin } from 'lucide-react'
import { toast } from 'sonner'

interface Profile {
  id: string
  source: string
  cvState: {
    fullName?: string
    email?: string
    phone?: string
    linkedin?: string
    location?: string
    summary?: string
    experience?: Array<{ title: string; company: string }>
    education?: Array<{ institution: string; degree: string }>
    skills?: string[]
  }
  linkedinUrl: string | null
  extractedAt: string
  createdAt: string
  updatedAt: string
}

type JobStatus = 'active' | 'completed' | 'failed' | 'delayed' | 'waiting'

export function ProfileForm() {
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null)
  const [jobPosition, setJobPosition] = useState<number | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Load existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile')
        if (!res.ok) throw new Error('Failed to load profile')
        const data = await res.json()
        setProfile(data.profile)
      } catch (error) {
        console.error('[profile-form] Failed to load profile:', error)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [])

  // Poll job status
  useEffect(() => {
    if (!jobId) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/profile/status/${jobId}`)
        if (!res.ok) throw new Error('Failed to get job status')

        const data = await res.json()
        setJobStatus(data.status)
        setJobPosition(data.position)

        if (data.status === 'completed') {
          clearInterval(pollInterval)
          setJobId(null)
          toast.success('Perfil extraído com sucesso')
          // Reload profile
          const profileRes = await fetch('/api/profile')
          if (profileRes.ok) {
            const profileData = await profileRes.json()
            setProfile(profileData.profile)
          }
        } else if (data.status === 'failed') {
          clearInterval(pollInterval)
          setJobId(null)
          toast.error('Falha ao extrair perfil. Tente novamente.')
        }
      } catch (error) {
        console.error('[profile-form] Failed to poll job status:', error)
      }
    }, 2000)

    return () => clearInterval(pollInterval)
  }, [jobId])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setIsLoading(true)

      try {
        const res = await fetch('/api/profile/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl }),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Failed to start extraction')
        }

        const data = await res.json()
        setJobId(data.jobId)
        setJobStatus('waiting')
        setJobPosition(data.position)
        setLinkedinUrl('')

        toast.info('Sua requisição foi adicionada à fila. Isso pode levar alguns minutos.')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Erro ao processar solicitação')
      } finally {
        setIsLoading(false)
      }
    },
    [linkedinUrl]
  )

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  // Show job processing state
  if (jobId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Processando Perfil
          </CardTitle>
          <CardDescription>Aguarde enquanto extraímos seus dados do LinkedIn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-900">
                Status: <strong>{jobStatus || 'processando'}</strong>
              </p>
              {jobPosition !== null && (
                <p className="mt-2 text-sm text-blue-800">
                  Posição na fila: <strong>{jobPosition}</strong>
                </p>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Não feche esta página enquanto estamos processando seu perfil.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show existing profile
  if (profile) {
    const cvState = profile.cvState
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Perfil Salvo
          </CardTitle>
          <CardDescription>
            Extraído de {profile.source} em {new Date(profile.extractedAt).toLocaleDateString('pt-BR')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {cvState.fullName && (
              <div>
                <p className="text-sm font-medium text-gray-600">Nome</p>
                <p className="text-lg font-semibold">{cvState.fullName}</p>
              </div>
            )}
            {cvState.email && (
              <div>
                <p className="text-sm font-medium text-gray-600">Email</p>
                <p className="text-lg">{cvState.email}</p>
              </div>
            )}
            {cvState.phone && (
              <div>
                <p className="text-sm font-medium text-gray-600">Telefone</p>
                <p className="text-lg">{cvState.phone}</p>
              </div>
            )}
            {cvState.location && (
              <div>
                <p className="text-sm font-medium text-gray-600">Localização</p>
                <p className="text-lg">{cvState.location}</p>
              </div>
            )}
          </div>

          {cvState.summary && (
            <div>
              <p className="text-sm font-medium text-gray-600">Resumo Profissional</p>
              <p className="mt-2 text-sm text-gray-700">{cvState.summary}</p>
            </div>
          )}

          {cvState.experience && cvState.experience.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600">Experiências</p>
              <p className="mt-2 text-sm text-gray-600">{cvState.experience.length} posições</p>
            </div>
          )}

          {cvState.education && cvState.education.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600">Formação</p>
              <p className="mt-2 text-sm text-gray-600">{cvState.education.length} cursos</p>
            </div>
          )}

          {cvState.skills && cvState.skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-600">Habilidades</p>
              <p className="mt-2 text-sm text-gray-600">{cvState.skills.length} habilidades</p>
            </div>
          )}

          <div className="border-t pt-4">
            <Button
              onClick={() => {
                setProfile(null)
                setLinkedinUrl('')
              }}
              variant="outline"
              className="w-full"
            >
              Atualizar Perfil
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show form to submit LinkedIn URL
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Linkedin className="h-5 w-5" />
          Conectar Perfil do LinkedIn
        </CardTitle>
        <CardDescription>
          Importamos seus dados profissionais para pré-preencher seu currículo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="linkedin-url">URL do Perfil LinkedIn</Label>
            <Input
              id="linkedin-url"
              type="url"
              placeholder="https://www.linkedin.com/in/seu-usuario/"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              disabled={isLoading}
              required
            />
            <p className="mt-2 text-sm text-gray-600">
              Você encontra esse link no seu perfil do LinkedIn
            </p>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !linkedinUrl.trim()}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Linkedin className="mr-2 h-4 w-4" />
                Conectar LinkedIn
              </>
            )}
          </Button>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
              <p className="text-sm text-amber-800">
                Este é um passo opcional. Você também pode preencher seu currículo manualmente após criar uma sessão.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
