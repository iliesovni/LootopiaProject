'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiClient, ApiClientError, ParticipationPublic } from '@/lib/frontend/api-client'
import { ParticipationStatus } from '@prisma/client'

export default function MyHuntsPage() {
  const [participations, setParticipations] = useState<ParticipationPublic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [filter, setFilter] = useState<ParticipationStatus | 'ALL'>('ALL')

  useEffect(() => {
    async function loadParticipations() {
      try {
        setIsLoading(true)
        const response = await apiClient.listMyParticipations()
        setParticipations(response.items)
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Erreur lors du chargement'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadParticipations()
  }, [])

    const filtered =
        filter === 'ALL'
            ? (participations ?? [])
            : (participations ?? []).filter((p) => p.status === filter)

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string; icon: string }> = {
      IN_PROGRESS: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: '🎮' },
      COMPLETED: { label: 'Terminée', color: 'bg-green-100 text-green-800', icon: '✅' },
      ABANDONED: { label: 'Abandonnée', color: 'bg-gray-100 text-gray-800', icon: '⊘' },
    }
    const s = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: '◯' }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${s.color}`}>
        {s.icon} {s.label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            ← Accueil
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Mes chasses</h1>
          <p className="mt-3 text-lg text-gray-600">Gère tes participations en cours et tes résultats</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-2 sm:gap-3">
          {['ALL', ParticipationStatus.IN_PROGRESS, ParticipationStatus.COMPLETED, ParticipationStatus.ABANDONED].map(
            (s) => (
              <button
                key={s}
                onClick={() => setFilter(s as any)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                  filter === s
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'border border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {s === 'ALL' ? 'Toutes' : s === 'IN_PROGRESS' ? 'En cours' : s === 'COMPLETED' ? 'Terminées' : 'Abandonnées'}
              </button>
            )
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-lg text-gray-600 mb-4">
              {filter === 'ALL'
                ? 'Aucune participation pour le moment.'
                : `Aucune chasse ${filter === 'IN_PROGRESS' ? 'en cours' : filter === 'COMPLETED' ? 'terminée' : 'abandonnée'}.`}
            </p>
            <Link href="/discover" className="inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-white hover:shadow-lg">
              Découvrir des chasses
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((participation) => {
              const completedSteps = participation.stepProgress.filter((p) => p.isCompleted).length
              const totalSteps = participation.stepProgress.length
              const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

              return (
                <div
                  key={participation.id}
                  className="group rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden"
                >
                  <div className="p-4 sm:p-5 sm:flex sm:items-center sm:justify-between gap-4">
                    <div className="flex-1 min-w-0 mb-4 sm:mb-0">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 truncate">
                        {participation.hunt?.title}
                      </h2>
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">📍 {participation.hunt?.location}</span>
                        <span className="flex items-center gap-1">📊 {participation.totalScore} points</span>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>Progression: {completedSteps}/{totalSteps} étapes</span>
                          <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3">
                        {getStatusBadge(participation.status)}
                      </div>
                    </div>

                    <div className="sm:flex-shrink-0">
                      {participation.status === ParticipationStatus.IN_PROGRESS ? (
                        <Link
                          href={`/play/${participation.id}`}
                          className="block w-full sm:w-auto text-center rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-6 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg hover:from-green-700 hover:to-green-800 active:scale-95"
                        >
                          Continuer →
                        </Link>
                      ) : (
                        <div className="text-center sm:text-right">
                          <p className="text-sm text-gray-600">
                            {participation.completedAt
                              ? new Date(participation.completedAt).toLocaleDateString('fr-FR', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })
                              : 'Terminée'}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">Score final: {participation.totalScore}pts</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
