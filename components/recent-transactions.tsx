"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface Transaction {
  id: number
  date: string
  ticker: string
  operation: "buy" | "sell"
  quantity: number
  price: number
  fees: number
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch(`${API_BASE_URL}/api/operacoes`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data.slice(0, 5)) // Últimas 5 operações
      }
    } catch (error) {
      console.error("Erro ao carregar transações:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-muted rounded-lg"></div>
          </div>
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return <div className="text-center text-muted-foreground py-8">Nenhuma operação encontrada</div>
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                transaction.operation === "buy" ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {transaction.operation === "buy" ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{transaction.ticker}</span>
                <Badge variant={transaction.operation === "buy" ? "secondary" : "destructive"}>
                  {transaction.operation === "buy" ? "Compra" : "Venda"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {transaction.quantity} ações • {formatCurrency(transaction.price)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{formatCurrency(transaction.quantity * transaction.price)}</p>
            <p className="text-xs text-muted-foreground">{new Date(transaction.date).toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
