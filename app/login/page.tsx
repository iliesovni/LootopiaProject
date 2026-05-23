'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { ApiClientError } from '@/lib/frontend/api-client'
import { loginSchema } from '@/schemas/auth'

export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useSession()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, isLoading, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    const validation = loginSchema.safeParse({ identifier, password })
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    setIsSubmitting(true)
    try {
      await login(validation.data)
      router.push('/')
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Erreur inconnue lors de la connexion.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold">Connexion</h1>
      <p className="mt-2 text-sm text-gray-600">Connecte-toi avec ton email ou ton username.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Email ou username</span>
          <input
            className="rounded border border-black/20 px-3 py-2"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Mot de passe</span>
          <input
            className="rounded border border-black/20 px-3 py-2"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage && (
          <p className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {errorMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Pas encore de compte ?{' '}
        <Link href="/register" className="underline">
          Créer un compte
        </Link>
      </p>
    </main>
  )
}
