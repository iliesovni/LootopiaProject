'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useState } from 'react'
import { useSession } from '@/components/auth/SessionProvider'
import { ApiClientError } from '@/lib/frontend/api-client'
import { registerSchema } from '@/schemas/auth'

export default function RegisterPage() {
  const router = useRouter()
  const { register, login, isAuthenticated, isLoading } = useSession()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
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

    const validation = registerSchema.safeParse({ email, username, password })
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message ?? 'Formulaire invalide.')
      return
    }

    setIsSubmitting(true)
    try {
      await register(validation.data)
      await login({ identifier: validation.data.email, password: validation.data.password })
      router.push('/')
    } catch (error) {
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Erreur inconnue lors de la création du compte.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-md px-6 py-10">
      <h1 className="text-2xl font-semibold">Créer un compte</h1>
      <p className="mt-2 text-sm text-gray-600">Le compte est créé puis connecté automatiquement.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">Email</span>
          <input
            className="rounded border border-black/20 px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm">Username</span>
          <input
            className="rounded border border-black/20 px-3 py-2"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
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
            autoComplete="new-password"
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
          {isSubmitting ? 'Création...' : 'Créer le compte'}
        </button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Déjà inscrit ?{' '}
        <Link href="/login" className="underline">
          Se connecter
        </Link>
      </p>
    </main>
  )
}
