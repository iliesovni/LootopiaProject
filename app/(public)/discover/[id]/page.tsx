'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { apiClient, ApiClientError, HuntPublicDetail } from '@/lib/frontend/api-client'
import { Role } from '@prisma/client'

export default function HuntDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, isAuthenticated, isLoading } = useSession()

  const [hunt, setHunt] = useState<HuntPublicDetail | null>(null)
  const [isLoadingHunt, setIsLoadingHunt] = useState(true)
  const [error, setError] = useState<string>('')
  const [isJoining, setIsJoining] = useState(false)
  const [accessCode, setAccessCode] = useState('')
  const [showAccessCodeForm, setShowAccessCodeForm] = useState(false)

  const huntId = params.id as string

  useEffect(() => {
    async function loadHunt() {
      try {
        setIsLoadingHunt(true)
        const huntData = await apiClient.getHuntDetail(huntId)
        setHunt(huntData)
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Erreur lors du chargement'
        setError(message)
      } finally {
        setIsLoadingHunt(false)
      }
    }

    if (huntId) {
      loadHunt()
    }
  }, [huntId])

  async function handleJoinHunt() {
    if (!isAuthenticated || !hunt) return

    try {
      setIsJoining(true)
      const participation = await apiClient.startParticipation({
        huntId: hunt.id,
        accessCode: accessCode || undefined,
      })
      router.push(`/play/${participation.id}`)
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erreur lors de la connexion'
      setError(message)

      if (err instanceof ApiClientError && err.code === 'ACCESS_CODE_REQUIRED') {
        setShowAccessCodeForm(true)
      }
    } finally {
      setIsJoining(false)
    }
  }

  if (isLoadingHunt) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <p className="text-gray-600">Chargement de la chasse...</p>
        </div>
      </main>
    )
  }

  if (!hunt || error) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error || 'Chasse introuvable'}
          </div>

          <Link
            href="/discover"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-white hover:bg-black/85"
          >
            Retour aux chasses
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        <Link
          href="/discover"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Retour aux chasses
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {hunt.bannerUrl && (
              <div className="relative h-64 overflow-hidden rounded-xl bg-gray-200 sm:h-80">
                <img
                  src={hunt.bannerUrl}
                  alt={hunt.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div>
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                    {hunt.title}
                  </h1>
                </div>

                <span className="shrink-0 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-2 text-sm font-medium text-purple-700">
                  {hunt.difficulty}
                </span>
              </div>

              <p className="text-lg text-gray-600">{hunt.description}</p>

              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-1 text-2xl">📍</div>
                  <p className="text-xs text-gray-600">Localisation</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {hunt.location}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-1 text-2xl">🗺️</div>
                  <p className="text-xs text-gray-600">Étapes</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {hunt._count.steps}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-1 text-2xl">👤</div>
                  <p className="text-xs text-gray-600">Créateur</p>
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {hunt.createdBy.username}
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="mb-1 text-2xl">⭐</div>
                  <p className="text-xs text-gray-600">Défi</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {hunt.difficulty}
                  </p>
                </div>
              </div>
            </div>

            {hunt._count.steps > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-900">
                  Étapes de la chasse
                </h2>

                <p className="text-gray-600">
                  Cette chasse contient{' '}
                  <strong>
                    {hunt._count.steps} étape
                    {hunt._count.steps !== 1 ? 's' : ''}
                  </strong>{' '}
                  à découvrir en rejoignant. Chaque étape te proposera des indices
                  et une récompense en points!
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-4 rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Prêt à jouer?
              </h3>

              {!isLoading && !isAuthenticated ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Connecte-toi pour rejoindre cette chasse et commencer
                    l'aventure!
                  </p>

                  <div className="space-y-3">
                    <Link
                      href="/login"
                      className="block w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 text-center font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl active:scale-95"
                    >
                      Se connecter
                    </Link>

                    <Link
                      href="/register"
                      className="block w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-center font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95"
                    >
                      Créer un compte
                    </Link>
                  </div>
                </div>
              ) : user?.role === Role.PLAYER ? (
                <div className="space-y-4">
                  {showAccessCodeForm ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Cette chasse est privée. Entre le code d'accès.
                      </p>

                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="12345678"
                        value={accessCode}
                        onChange={(e) =>
                          setAccessCode(
                            e.target.value.replace(/\D/g, '').slice(0, 8)
                          )
                        }
                        className="w-full rounded-lg border-2 border-gray-200 px-4 py-3 text-center font-mono text-lg outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                        maxLength={8}
                      />

                      <button
                        onClick={handleJoinHunt}
                        disabled={isJoining || accessCode.length !== 8}
                        className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isJoining ? 'Vérification...' : 'Vérifier le code'}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={handleJoinHunt}
                        disabled={isJoining}
                        className="w-full rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 font-semibold text-white shadow-lg transition-all hover:from-green-700 hover:to-green-800 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isJoining
                          ? 'Connexion en cours...'
                          : '🎮 Rejoindre la chasse'}
                      </button>

                      <p className="text-center text-xs text-gray-500">
                        Tu peux continuer à jouer même sans terminer
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Tu dois être joueur pour rejoindre une chasse.
                  </p>

                  <p className="text-xs text-gray-500">
                    Contacte un administrateur si tu veux changer de rôle.
                  </p>
                </div>
              )}

              {error && (
                <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <p className="text-xs text-gray-500">
                  📍 Coordonnées de départ:
                  <br />
                  {hunt.startLat.toFixed(4)}, {hunt.startLng.toFixed(4)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}