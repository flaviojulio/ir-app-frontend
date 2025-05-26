"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { authAPI, AuthManager, type User, handleAPIError } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthState {
  user: User | null
  isLoading: boolean
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: {
    username: string
    email: string
    senha: string
    nome_completo?: string
  }) => Promise<void>
}

interface AuthContextType extends AuthState, AuthActions {
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
  })

  const router = useRouter()

  useEffect(() => {
    const initAuth = async () => {
      if (AuthManager.isAuthenticated()) {
        try {
          const userData = await authAPI.getMe()
          setAuthState({ user: userData, isLoading: false })
        } catch (error) {
          AuthManager.removeToken()
          handleAPIError(error)
          setAuthState({ user: null, isLoading: false })
        }
      } else {
        setAuthState({ user: null, isLoading: false })
      }
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))
      const response = await authAPI.login(username, password)
      AuthManager.setToken(response.access_token)

      const userData = await authAPI.getMe()
      setAuthState({ user: userData, isLoading: false })

      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${userData.nome_completo || userData.username}!`,
      })

      router.push("/")
    } catch (error) {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
      handleAPIError(error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      AuthManager.removeToken()
      setAuthState({ user: null, isLoading: false })
      router.push("/login")

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    }
  }

  const register = async (userData: {
    username: string
    email: string
    senha: string
    nome_completo?: string
  }) => {
    try {
      setAuthState((prev) => ({ ...prev, isLoading: true }))
      await authAPI.register(userData)

      toast({
        title: "Conta criada",
        description: "Sua conta foi criada com sucesso. Faça login para continuar.",
      })

      router.push("/login")
    } catch (error) {
      handleAPIError(error)
      throw error
    } finally {
      setAuthState((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const contextValue: AuthContextType = {
    ...authState,
    isAuthenticated: !!authState.user,
    login,
    logout,
    register,
  }

  return AuthContext.Provider({ value: contextValue, children })
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
