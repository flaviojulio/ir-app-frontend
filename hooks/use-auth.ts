"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { authAPI, AuthManager, type User, handleAPIError } from "@/lib/api"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (userData: {
    username: string
    email: string
    senha: string
    nome_completo?: string
  }) => Promise<void>
}

// Criar contexto com valor padrão
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
})

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = Boolean(user)

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthManager.isAuthenticated()) {
          const userData = await authAPI.getMe()
          setUser(userData)
        }
      } catch (error) {
        AuthManager.removeToken()
        handleAPIError(error)
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authAPI.login(username, password)
      AuthManager.setToken(response.access_token)

      const userData = await authAPI.getMe()
      setUser(userData)

      toast({
        title: "Login realizado",
        description: `Bem-vindo, ${userData.nome_completo || userData.username}!`,
      })

      router.push("/")
    } catch (error) {
      handleAPIError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      AuthManager.removeToken()
      setUser(null)
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
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)

  // Verificação adicional para debug
  if (context === undefined) {
    console.error("useAuth foi chamado fora do AuthProvider")
    throw new Error("useAuth must be used within an AuthProvider")
  }

  return context
}
