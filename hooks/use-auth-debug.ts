"use client"
import { useAuth } from "./use-auth"

export function useAuthDebug() {
  const auth = useAuth() // Moved useAuth call to the top level
  try {
    console.log("Auth Context:", {
      user: auth.user,
      isLoading: auth.isLoading,
      isAuthenticated: auth.isAuthenticated,
    })
    return auth
  } catch (error) {
    console.error("Erro ao acessar AuthContext:", error)
    console.log("Verifique se o componente está dentro do AuthProvider")
    throw error
  }
}
