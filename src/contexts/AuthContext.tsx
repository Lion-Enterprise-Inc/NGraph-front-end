'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { AuthApi, TokenService, User } from '../services/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isRestaurantOwner: boolean
  isPlatformOwner: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Initialize auth state from storage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedUser = TokenService.getUser()
        const token = TokenService.getAccessToken()

        if (storedUser && token) {
          setUser(storedUser)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        TokenService.clearAll()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      const response = await AuthApi.login({ email, password })

      if (response.result?.user) {
        setUser(response.result.user)
        return { success: true }
      }

      return { success: false, error: 'Login failed' }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    AuthApi.logout()
    setUser(null)
  }, [])

  const isAuthenticated = !!user && TokenService.isAuthenticated()
  const isRestaurantOwner = user?.role === 'restaurant_owner'
  const isPlatformOwner = user?.role === 'platform_owner'

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isRestaurantOwner,
    isPlatformOwner,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Convenience hooks
export function useIsRestaurantOwner(): boolean {
  const { isRestaurantOwner } = useAuth()
  return isRestaurantOwner
}

export function useIsPlatformOwner(): boolean {
  const { isPlatformOwner } = useAuth()
  return isPlatformOwner
}

export default AuthContext