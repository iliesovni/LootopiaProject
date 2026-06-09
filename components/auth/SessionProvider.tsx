'use client'

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { apiClient, ApiClientError, AuthUser, LoginInput, RegisterInput } from '@/lib/frontend/api-client'

type SessionContextValue = {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  refreshSession: () => Promise<void>
  login: (input: LoginInput) => Promise<AuthUser>
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
      if (error instanceof ApiClientError && error.status === 401) {
        setUser(null)
        return
      }
      throw error
    }
  }

  async function login(input: LoginInput) {
    const loggedInUser = await apiClient.login(input)
    setUser(loggedInUser)
    return loggedInUser
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
