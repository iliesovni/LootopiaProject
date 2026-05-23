'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ApiClientError } from '@/lib/frontend/api-client'
import { useSession } from '@/components/auth/SessionProvider'

export default function AppHeader() {
  const router = useRouter()
  const { user, isAuthenticated, logout, isLoading } = useSession()
  const [errorMessage, setErrorMessage] = useState('')

  async function handleLogout() {
    setErrorMessage('')
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      setErrorMessage(error instanceof ApiClientError ? error.message : 'Erreur lors de la déconnexion.')
    }
  }

  return (
    <header className="border-b border-black/10 px-6 py-3">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="font-semibold">
            Lootopia
          </Link>
          <Link href="/api-docs" className="text-sm text-gray-600 hover:text-gray-900">
            API docs
          </Link>
        </div>

        <div className="flex items-center gap-3 text-sm">
          {isLoading ? (
            <span className="text-gray-500">Session...</span>
          ) : isAuthenticated ? (
            <>
              <span className="text-gray-700">
                Connecté: <strong>{user?.username}</strong> ({user?.role})
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded border border-black/20 px-3 py-1 hover:bg-black/5"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded border border-black/20 px-3 py-1 hover:bg-black/5">
                Login
              </Link>
              <Link href="/register" className="rounded border border-black/20 px-3 py-1 hover:bg-black/5">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      {errorMessage && (
        <p className="mx-auto mt-2 max-w-5xl text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      )}
    </header>
  )
}
