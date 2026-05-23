'use client'

import Link from 'next/link'
import { useSession } from '@/components/auth/SessionProvider'
import { Role } from '@prisma/client'

export default function Home() {
  const { user, isAuthenticated, isLoading } = useSession()

  return (
    <main className="min-h-[calc(100vh-60px)] bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Bienvenue sur <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Lootopia</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 sm:text-xl md:leading-8">
              Crée des chasses aux trésors incroyables, explore de nouveaux mondes, et collecte des points avec tes amis.
            </p>
          </div>

          {isLoading ? (
            <div className="mt-12 text-center text-gray-600">
              <p>Vérification de la session...</p>
            </div>
          ) : !isAuthenticated ? (
            /* Not authenticated */
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-6">
              <Link
                href="/login"
                className="rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:from-purple-700 hover:to-pink-700 active:scale-95 sm:px-10"
              >
                Se connecter
              </Link>
              <Link
                href="/register"
                className="rounded-lg border-2 border-gray-300 px-8 py-3 font-semibold text-gray-900 transition-all hover:border-gray-400 hover:bg-gray-50 active:scale-95 sm:px-10"
              >
                Créer un compte
              </Link>
            </div>
          ) : (
            /* Authenticated */
            <div className="mt-12 space-y-8">
              {/* User greeting */}
              <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-r from-purple-50 to-pink-50 p-6 ring-1 ring-purple-200">
                <p className="text-center text-lg">
                  <span className="font-semibold text-gray-900">Bienvenue, {user?.username}!</span>
                  <span className="block text-sm text-gray-600 mt-1">Rôle: <span className="font-medium text-purple-600">{user?.role}</span></span>
                </p>
              </div>

              {/* Quick actions grid */}
              {user?.role === Role.PLAYER ? (
                /* Player actions */
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/discover"
                    className="group rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-6 ring-1 ring-green-200 transition-all hover:ring-green-300 hover:shadow-lg active:scale-95"
                  >
                    <div className="text-3xl mb-3"></div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-700">Découvrir des chasses</h3>
                    <p className="mt-2 text-sm text-gray-600">Rejoins une nouvelle partie et gagne des points</p>
                  </Link>

                  <Link
                    href="/my-hunts"
                    className="group rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 ring-1 ring-blue-200 transition-all hover:ring-blue-300 hover:shadow-lg active:scale-95"
                  >
                    <div className="text-3xl mb-3"></div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Mes participations</h3>
                    <p className="mt-2 text-sm text-gray-600">Gère tes chasses en cours et résultats</p>
                  </Link>
                </div>
              ) : (user?.role === Role.PARTNER || user?.role === Role.ADMIN) ? (
                /* Creator actions */
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/hunts"
                    className="group rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 ring-1 ring-purple-200 transition-all hover:ring-purple-300 hover:shadow-lg active:scale-95"
                  >
                    <div className="text-3xl mb-3"></div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">Mes chasses</h3>
                    <p className="mt-2 text-sm text-gray-600">Crée et gère tes chasses au trésor</p>
                  </Link>

                  <Link
                    href="/discover"
                    className="group rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-6 ring-1 ring-orange-200 transition-all hover:ring-orange-300 hover:shadow-lg active:scale-95"
                  >
                    <div className="text-3xl mb-3"></div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-700">Catalog public</h3>
                    <p className="mt-2 text-sm text-gray-600">Parcourir toutes les chasses disponibles</p>
                  </Link>
                </div>
              ) : null}

              {/* Secondary actions */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/discover"
                  className="rounded-lg border border-gray-300 px-6 py-2 text-center font-medium text-gray-900 transition-all hover:bg-gray-50"
                >
                  → Parcourir les chasses
                </Link>
                <Link
                  href="/api-docs"
                  className="rounded-lg border border-gray-300 px-6 py-2 text-center font-medium text-gray-900 transition-all hover:bg-gray-50"
                >
                  Documentation API
                </Link>
                <Link
                  href="/test-map"
                  className="rounded-lg border border-gray-300 px-6 py-2 text-center font-medium text-gray-900 transition-all hover:bg-gray-50"
                >
                  Sandbox
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Features section */}
      {!isAuthenticated && !isLoading && (
        <section className="px-4 py-16 sm:px-6 sm:py-20 bg-white">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">Pourquoi Lootopia?</h2>

            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-purple-100">
                  <span className="text-2xl"></span>
                </div>
                <h3 className="font-semibold text-gray-900">Crée facilement</h3>
                <p className="mt-2 text-sm text-gray-600">Crée tes propres chasses en quelques clics avec notre interface intuitive</p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-pink-100">
                  <span className="text-2xl"></span>
                </div>
                <h3 className="font-semibold text-gray-900">Partage le monde</h3>
                <p className="mt-2 text-sm text-gray-600">Partage tes créations avec la communauté ou garde-les privées</p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-4 w-12 h-12 flex items-center justify-center rounded-full bg-green-100">
                  <span className="text-2xl"></span>
                </div>
                <h3 className="font-semibold text-gray-900">Explore en local</h3>
                <p className="mt-2 text-sm text-gray-600">Découvre des chasses près de toi et joue en famille ou entre amis</p>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
