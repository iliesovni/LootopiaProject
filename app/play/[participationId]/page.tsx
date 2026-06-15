'use client'

import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { apiClient, ApiClientError, ParticipationPreGame } from '@/lib/frontend/api-client'
import { ParticipationStatus } from '@prisma/client'

const DIFFICULTY_LABELS: Record<string, string> = {
  EASY: 'Facile',
  MEDIUM: 'Moyen',
  HARD: 'Difficile',
}

const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  ABANDONED: 'Abandonnée',
}

function getDifficultyLabel(difficulty: string) {
  return DIFFICULTY_LABELS[difficulty] ?? difficulty
}

function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status
}

export default function ParticipationPreGamePage() {
  const router = useRouter()
  const params = useParams()
  const participationId = params.participationId as string
  const { isAuthenticated, isLoading: isSessionLoading } = useSession()

  const [preGame, setPreGame] = useState<ParticipationPreGame | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isSessionLoading) return

    if (!isAuthenticated) {
      router.replace(`/login?redirect=/play/${participationId}`)
      return
    }

    async function loadPreGame() {
      try {
        setIsLoading(true)
        setError('')
        const data = await apiClient.getParticipationPreGame(participationId)
        setPreGame(data)
      } catch (err) {
        const message =
          err instanceof ApiClientError ? err.message : 'Erreur lors du chargement de la pré-partie'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (participationId) {
      loadPreGame()
    }
  }, [isAuthenticated, isSessionLoading, participationId, router])

  if (isSessionLoading || isLoading) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-40 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </main>
    )
  }

  if (error || !preGame) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error || 'Pré-partie introuvable'}
          </div>
          <Link
            href="/my-hunts"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white hover:bg-black/85"
          >
            Retour à mes chasses
          </Link>
        </div>
      </main>
    )
  }

  const { participation, hunt, participants } = preGame
  const completedSteps = participation.stepProgress.filter((step) => step.isCompleted).length
  const totalSteps = participation.stepProgress.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0
  const canLaunch = participation.status === ParticipationStatus.IN_PROGRESS

  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/my-hunts"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Mes chasses
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {hunt.bannerUrl && (
              <div className="relative h-56 overflow-hidden rounded-xl bg-gray-200 sm:h-72">
                <img
                  src={hunt.bannerUrl}
                  alt={hunt.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-purple-600">Pré-partie</p>
                  <h1 className="mt-1 text-3xl font-bold text-gray-900 sm:text-4xl">{hunt.title}</h1>
                </div>
                <span className="rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 text-sm font-medium text-purple-700">
                  {getDifficultyLabel(hunt.difficulty)}
                </span>
              </div>

              {hunt.description && (
                <p className="text-lg text-gray-600">{hunt.description}</p>
              )}

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <p className="text-xs text-gray-600">Localisation</p>
                  <p className="text-sm font-semibold text-gray-900">{hunt.location}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <p className="text-xs text-gray-600">Étapes</p>
                  <p className="text-sm font-semibold text-gray-900">{hunt._count.steps}</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <p className="text-xs text-gray-600">Créateur</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {hunt.createdBy.username}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-slate-50 p-4">
                  <p className="text-xs text-gray-600">Tes points</p>
                  <p className="text-sm font-semibold text-gray-900">{participation.totalScore} pts</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    Progression : {completedSteps}/{totalSteps} étapes
                  </span>
                  <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Parcours de la chasse</h2>
              {hunt.steps.length === 0 ? (
                <p className="text-gray-600">Aucune étape configurée pour cette chasse.</p>
              ) : (
                <ol className="space-y-3">
                  {hunt.steps.map((step, index) => {
                    const progressEntry = participation.stepProgress.find(
                      (entry) => entry.stepId === step.id
                    )
                    const isCompleted = progressEntry?.isCompleted ?? false
                    const isCurrent = participation.currentStep?.stepId === step.id

                    return (
                      <li
                        key={step.id}
                        className={`rounded-lg border p-4 ${
                          isCurrent
                            ? 'border-green-300 bg-green-50'
                            : isCompleted
                              ? 'border-gray-200 bg-gray-50 opacity-80'
                              : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-sm font-semibold text-purple-700">
                                {index + 1}
                              </span>
                              <h3 className="font-semibold text-gray-900">{step.title}</h3>
                              {isCompleted && (
                                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                                  Validée
                                </span>
                              )}
                              {isCurrent && (
                                <span className="rounded-full bg-green-200 px-2 py-0.5 text-xs font-medium text-green-900">
                                  Prochaine
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-gray-600">{step.description}</p>
                            <p className="mt-2 text-xs text-gray-500">
                              {step._count.clues} indice{step._count.clues !== 1 ? 's' : ''} ·{' '}
                              {step.pointsReward} points
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ol>
              )}
            </div>
          </div>

          <div className="space-y-4 lg:col-span-1">
            <div className="sticky top-20 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-gray-900">Prêt à jouer ?</h2>

              {canLaunch ? (
                <>
                  <p className="text-sm text-gray-600">
                    Lance la chasse pour accéder à la carte et commencer le parcours.
                  </p>
                  <Link
                    href={`/play/${participationId}/map`}
                    className="block w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-center font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-green-800 hover:shadow-xl active:scale-95"
                  >
                    Lancer la chasse
                  </Link>
                </>
              ) : (
                <p className="text-sm text-gray-600">
                  Cette participation est {getStatusLabel(participation.status).toLowerCase()}.
                </p>
              )}

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  Point de départ : {hunt.startLat.toFixed(4)}, {hunt.startLng.toFixed(4)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Participants ({participants.length})
              </h2>

              {participants.length === 0 ? (
                <p className="text-sm text-gray-600">Aucun participant pour le moment.</p>
              ) : (
                <ul className="space-y-2">
                  {participants.map((participant, index) => (
                    <li
                      key={participant.participationId}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        participant.isCurrentUser ? 'bg-purple-50 ring-1 ring-purple-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-5 text-sm font-semibold text-gray-500">{index + 1}</span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {participant.username}
                            {participant.isCurrentUser && (
                              <span className="ml-1 text-xs text-purple-600">(toi)</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getStatusLabel(participant.status)}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 font-semibold text-gray-900">
                        {participant.totalScore} pts
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
