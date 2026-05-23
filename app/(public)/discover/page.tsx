'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { apiClient, ApiClientError, HuntPublicList } from '@/lib/frontend/api-client'

export default function DiscoverPage() {
  const [hunts, setHunts] = useState<HuntPublicList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    async function loadHunts() {
      try {
        setIsLoading(true)
        const response = await apiClient.listPublicHunts()
        setHunts(response.items)
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Erreur lors du chargement'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadHunts()
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            ← Accueil
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">Les chasses disponibles</h1>
          <p className="mt-3 text-lg text-gray-600">Découvre les chasses au trésor du monde entier</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {hunts.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <p className="text-lg text-gray-600">Aucune chasse disponible pour le moment.</p>
            <Link href="/register" className="mt-4 inline-block rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-white hover:shadow-lg">
              Créer une chasse
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hunts.map((hunt) => (
              <Link
                key={hunt.id}
                href={`/discover/${hunt.id}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg hover:border-gray-300 active:scale-95"
              >
                {hunt.bannerUrl && (
                  <div className="relative h-40 overflow-hidden bg-gray-200">
                    <img
                      src={hunt.bannerUrl}
                      alt={hunt.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-gray-900 line-clamp-2 flex-1 group-hover:text-purple-600">
                      {hunt.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1 text-xs font-medium text-purple-700">
                      {hunt.difficulty}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">{hunt.description}</p>

                  <div className="space-y-2 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span className="truncate">{hunt.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span></span>
                      <span>{hunt._count.steps} étape{hunt._count.steps !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs text-gray-500">{hunt.createdBy.username}</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-green-50 to-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Rejoindre →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
