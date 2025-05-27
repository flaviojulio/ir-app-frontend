"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { api } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

interface User {
  id: number
  username: string
  email: string
  nome_completo: string
  funcoes: string[]
}

interface AuthContextType {
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      fetchUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const response = await api.get("/auth/me")
      setUser(response.data)
    } catch (error) {
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
    } finally {
      setLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    const formData = new FormData()
    formData.append("username", username)
    formData.append("password", password)

    try {
      const response = await api.post("/auth/login", formData)
      const { access_token, usuario } = response.data

      localStorage.setItem("token", access_token)
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`

      await fetchUser()
      // User state might not be updated yet, so use 'usuario' from response
      toast({ title: "Login realizado!", description: `Bem-vindo, ${usuario.nome_completo || usuario.username}!` });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Erro ao fazer login";
      toast({ title: "Erro no Login", description: errorMessage, variant: "destructive" });
      // Re-throw the error if you want to propagate it further or handle it elsewhere
      throw error;
    }
  }

  const logout = async () => {
    try {
      await api.post("/auth/logout")
    } catch (error) {
      // Ignore errors on logout, but still show toast
    } finally {
      localStorage.removeItem("token")
      delete api.defaults.headers.common["Authorization"]
      setUser(null)
      toast({ title: "Logout realizado", description: "Você foi desconectado." });
    }
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
