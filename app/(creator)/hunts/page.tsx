'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { apiClient, ApiClientError, HuntOwnerDetail } from '@/lib/frontend/api-client'
import { HuntStatus } from '@prisma/client'

export default function CreatorHuntsPage() {
  const { user } = useSession()
  const [hunts, setHunts] = useState<HuntOwnerDetail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [publishConfirm, setPublishConfirm] = useState<string | null>(null)

  useEffect(() => {
    async function loadHunts() {
      try {
        setIsLoading(true)
        const response = await apiClient.listMyHunts()
        setHunts(response.items ?? [])
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Erreur lors du chargement'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadHunts()
  }, [])

  const handleDeleteHunt = async (huntId: string) => {
    try {
      await apiClient.deleteHunt(huntId)
      setHunts((hunts ?? []).filter((h) => h.id !== huntId))
      setDeleteConfirm(null)
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Erreur lors de la suppression'
      setError(message)
    }
  }

  const handlePublishHunt = async (huntId: string) => {
    try {
      const publishedHunt = await apiClient.publishHunt(huntId)
      setHunts((hunts ?? []).map((h) => (h.id === huntId ? publishedHunt : h)))
    } catch (err) {
      console.error('Publish error:', err)
      if (err instanceof ApiClientError) {
        console.error('Error code:', err.code, 'Status:', err.status)
      }
      let message = 'Erreur lors de la publication'
      if (err instanceof ApiClientError) {
        switch (err.code) {
          case 'HUNT_NOT_ENOUGH_STEPS':
            message = 'La chasse doit avoir au moins 2 étapes pour être publiée'
            break
          case 'HUNT_MISSING_ACCESS_CODE':
            message = "Une chasse privée doit avoir un code d'accès"
            break
          case 'HUNT_INVALID_STEP_ORDER':
            message = 'Les étapes de la chasse ne sont pas dans le bon ordre'
            break
          case 'HUNT_ALREADY_PUBLISHED':
            message = 'Cette chasse est déjà publiée'
            break
          case 'HUNT_NOT_DRAFT':
            message = 'Seules les chasses en brouillon peuvent être publiées'
            break
          case 'HUNT_DELETED':
            message = 'Cette chasse a été supprimée'
            break
          default:
            message = err.message || 'Erreur inconnue lors de la publication'
        }
      }
      setError(message)
    }
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
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
              ← Accueil
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Mes chasses</h1>
            <p className="mt-3 text-lg text-gray-600">Crée et gère tes chasses au trésor</p>
          </div>
          <Link
            href="/hunts/new"
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-purple-700 hover:to-pink-700 active:scale-95 w-full sm:w-auto"
          >
            Créer une chasse
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {hunts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-lg text-gray-600 mb-4">Tu n'as pas encore créé de chasse.</p>
            <Link
              href="/hunts/new"
              className="inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-white hover:shadow-lg"
            >
              Créer ta première chasse
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {hunts.map((hunt) => (
              <div key={hunt.id} className="group rounded-xl border border-gray-200 bg-white hover:shadow-lg hover:border-gray-300 transition-all overflow-hidden">
                <div className="p-4 sm:p-5 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-xl font-semibold text-gray-900 group-hover:text-purple-600 line-clamp-2">
                          {hunt.title}
                        </h2>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                            hunt.status === HuntStatus.PUBLISHED
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {hunt.status === HuntStatus.PUBLISHED ? 'Publiée' : 'Brouillon'}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{hunt.description}</p>

                      <div className="grid grid-cols-2 gap-3 text-xs text-gray-600 sm:grid-cols-4">
                        <div className="flex items-center gap-2">
                          <span></span>
                          <span className="truncate">{hunt.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span></span>
                          <span>{hunt.difficulty}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span></span>
                          <span>{hunt.steps.length} étapes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>{hunt.visibility === 'PUBLIC' ? '' : ''}</span>
                          <span>{hunt.visibility === 'PUBLIC' ? 'Public' : 'Privé'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-2 sm:gap-3">
                    <Link
                      href={`/hunts/${hunt.id}`}
                      className="flex-1 sm:flex-none rounded-lg border border-gray-300 px-4 py-2 text-center font-medium text-gray-900 transition-all hover:bg-gray-50 active:scale-95"
                    >
                      Éditer
                    </Link>

                    {hunt.status === HuntStatus.DRAFT && (
                      <>
                        <button
                          onClick={() => setDeleteConfirm(hunt.id)}
                          className="flex-1 sm:flex-none rounded-lg border border-red-300 px-4 py-2 text-center font-medium text-red-600 transition-all hover:bg-red-50 active:scale-95"
                        >
                          Supprimer
                        </button>

                        {deleteConfirm === hunt.id && (
                          <div className="col-span-2 rounded-lg bg-red-50 p-3 border border-red-300">
                            <p className="text-sm text-red-700 mb-3">Êtes-vous sûr? Cette action est irréversible.</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeleteHunt(hunt.id)}
                                className="flex-1 rounded px-3 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 active:scale-95"
                              >
                                Confirmer
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 rounded px-3 py-2 border border-red-300 text-red-700 text-sm font-medium hover:bg-red-50 active:scale-95"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        )}

                        {publishConfirm === hunt.id && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
                              <div className="flex items-center mb-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div className="ml-4">
                                  <h3 className="text-lg font-semibold text-gray-900">Publier la chasse</h3>
                                  <p className="text-sm text-gray-600">Confirmer la publication</p>
                                </div>
                              </div>
                              <div className="mb-6">
                                <p className="text-sm text-gray-700">
                                  Attention ! Une fois publiée, cette chasse ne pourra plus être modifiée.
                                  Assurez-vous que toutes les étapes et indices sont corrects.
                                </p>
                              </div>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setPublishConfirm(null)
                                    handlePublishHunt(hunt.id)
                                  }}
                                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                                >
                                  Publier maintenant
                                </button>
                                <button
                                  onClick={() => setPublishConfirm(null)}
                                  className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {hunt.status === HuntStatus.DRAFT && hunt.steps.length > 0 && (
                      <button
                        onClick={() => setPublishConfirm(hunt.id)}
                        className="flex-1 sm:flex-none rounded-lg bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 text-center font-medium text-white transition-all hover:shadow-md hover:from-green-700 hover:to-green-800 active:scale-95"
                      >
                        Publier
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}