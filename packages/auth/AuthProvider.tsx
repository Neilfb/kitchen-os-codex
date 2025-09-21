'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
}

interface AuthContextProps {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_NOCODEBACKEND_API?.replace(/\/$/, '')

    if (!baseUrl) {
      const error = new Error('NEXT_PUBLIC_NOCODEBACKEND_API is not configured')
      console.error(error)
      throw error
    }

    try {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      let payload: unknown = null
      const contentType = res.headers.get('content-type') ?? ''

      if (contentType.includes('application/json')) {
        try {
          payload = await res.json()
        } catch (parseError) {
          console.error('Failed to parse login response payload as JSON', parseError)
        }
      } else {
        try {
          payload = await res.text()
        } catch (parseError) {
          console.error('Failed to read login response payload as text', parseError)
        }
      }

      const payloadObject =
        typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : null
      const payloadRecord = payloadObject as Record<string, any> | null

      if (!res.ok) {
        const payloadText = typeof payload === 'string' ? payload : null
        const payloadMessage =
          payloadRecord && typeof payloadRecord.message === 'string'
            ? payloadRecord.message
            : undefined
        const payloadError =
          payloadRecord && typeof payloadRecord.error === 'string' ? payloadRecord.error : undefined

        const message =
          payloadMessage ??
          payloadError ??
          (payloadText && payloadText.trim().length > 0 ? payloadText : undefined) ??
          `Login failed with status ${res.status}`

        const error = new Error(message)
        console.error(error)
        throw error
      }

      const token = payloadRecord && typeof payloadRecord.token === 'string' ? payloadRecord.token : undefined

      const rawUser =
        payloadRecord?.user && typeof payloadRecord.user === 'object'
          ? (payloadRecord.user as Record<string, any>)
          : null

      const fallbackId = payloadRecord && payloadRecord.user_id !== undefined ? payloadRecord.user_id : undefined
      const fallbackEmail = payloadRecord && typeof payloadRecord.email === 'string' ? payloadRecord.email : undefined

      const candidateId = rawUser && rawUser.id !== undefined ? rawUser.id : fallbackId
      const candidateEmail = rawUser && rawUser.email !== undefined ? rawUser.email : fallbackEmail

      let normalizedUser: User | null = null
      if ((typeof candidateId === 'string' || typeof candidateId === 'number') && typeof candidateEmail === 'string') {
        normalizedUser = { id: String(candidateId), email: candidateEmail }
        setUser(normalizedUser)
        localStorage.setItem('user', JSON.stringify(normalizedUser))
      }

      if (token) return token
      if (normalizedUser) return normalizedUser
      if (rawUser) return rawUser

      return null
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Login failed')
      console.error(error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
