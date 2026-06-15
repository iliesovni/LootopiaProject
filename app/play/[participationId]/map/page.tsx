'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import HuntGameplayMap from '@/components/HuntGameplayMap'
import { useSession } from '@/components/auth/SessionProvider'
import { apiClient, ApiClientError, ParticipationGameplay } from '@/lib/frontend/api-client'

export default function ParticipationMapPage() {
  const router = useRouter()
  const params = useParams()
  const participationId = params.participationId as string
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()

  const [gameplay, setGameplay] = useState<ParticipationGameplay | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSessionLoading) return

    if (!isAuthenticated) {
      router.replace(`/login?redirect=/play/${participationId}/map`)
      return
    }

    async function loadGameplay() {
      try {
        setIsLoading(true)
        setError('')
        const data = await apiClient.getParticipationGameplay(participationId)
        setGameplay(data)
      } catch (err) {
        if (err instanceof ApiClientError && err.code === 'PARTICIPATION_NOT_IN_PROGRESS') {
          router.replace(`/play/${participationId}`)
          return
        }
        const message =
          err instanceof ApiClientError ? err.message : 'Erreur lors du chargement de la carte'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (participationId) {
      loadGameplay()
    }
  }, [isAuthenticated, isSessionLoading, participationId, router])

  if (isSessionLoading || isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-60px)] items-center justify-center bg-slate-100 text-gray-600">
        Chargement de la carte...
      </div>
    )
  }

  if (error || !gameplay) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error || 'Impossible de charger la partie'}
          </div>
          <Link
            href={`/play/${participationId}`}
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white hover:bg-black/85"
          >
            Retour à la pré-partie
          </Link>
        </div>
      </main>
    )
  }

  return (
    <HuntGameplayMap
      participationId={participationId}
      initialGameplay={gameplay}
      onGameplayChange={setGameplay}
    />
  )
}
