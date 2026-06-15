'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, ApiClientError, AuthUser, LoginInput, RegisterInput } from '@/lib/frontend/api-client'

type SessionContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
  login: (input: LoginInput) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  async function refreshSession() {
    try {
      const currentUser = await apiClient.me()
      setUser(currentUser)
    } catch (error) {
      if (error instanceof ApiClientError) {
        if (error.status === 401) {
          setUser(null)
          return
        }

        if (error.status === 404) {
          console.error('[SessionProvider] Route /api/auth/me introuvable (404).', {
            path: error.path,
            method: error.method,
            code: error.code,
            message: error.message,
            details: error.details,
          })
          setUser(null)
          return
        }

        console.error('[SessionProvider] Échec refreshSession.', {
          path: error.path,
          method: error.method,
          status: error.status,
          code: error.code,
          message: error.message,
          details: error.details,
        })
      } else {
        console.error('[SessionProvider] Erreur inattendue lors du refreshSession.', error)
      }

      setUser(null)
    }
  }

  async function login(input: LoginInput) {
    const loggedInUser = await apiClient.login(input)
    setUser(loggedInUser)
  }

  async function register(input: RegisterInput) {
    await apiClient.register(input)
  }

  async function logout() {
    await apiClient.logout()
    setUser(null)
  }

  useEffect(() => {
    let active = true

    ;(async () => {
      try {
        await refreshSession()
      } catch (error) {
        console.error('[SessionProvider] Erreur non gérée au montage.', error)
        if (active) setUser(null)
      } finally {
        if (active) setIsLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      refreshSession,
      login,
      register,
      logout,
    }),
    [user, isLoading]
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within SessionProvider.')
  }
  return context
}
