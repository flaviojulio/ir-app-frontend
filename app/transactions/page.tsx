"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Search, Download } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface Transaction {
  id: number
  date: string
  ticker: string
  operation: "buy" | "sell"
  quantity: number
  price: number
  fees: number
  result?: number
  tax_due?: number
}

export default function TransactionsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<"all" | "buy" | "sell">("all")

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    try {
      // Simular dados de transações fechadas
      const mockTransactions: Transaction[] = [
        {
          id: 1,
          date: "2024-01-15",
          ticker: "ITUB4",
          operation: "sell",
          quantity: 100,
          price: 32.5,
          fees: 5.2,
          result: 450.3,
          tax_due: 67.55,
        },
        {
          id: 2,
          date: "2024-01-10",
          ticker: "PETR4",
          operation: "sell",
          quantity: 200,
          price: 28.75,
          fees: 8.4,
          result: -120.8,
          tax_due: 0,
        },
        {
          id: 3,
          date: "2024-01-08",
          ticker: "VALE3",
          operation: "sell",
          quantity: 50,
          price: 65.2,
          fees: 3.1,
          result: 234.9,
          tax_due: 35.24,
        },
      ]
      setTransactions(mockTransactions)
    } catch (error) {
      toast({
        title: "Erro ao carregar transações",
        description: "Não foi possível carregar as transações fechadas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = transaction.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === "all" || transaction.operation === filterType
    return matchesSearch && matchesFilter
  })

  const totalResult = transactions.reduce((sum, t) => sum + (t.result || 0), 0)
  const totalTaxDue = transactions.reduce((sum, t) => sum + (t.tax_due || 0), 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando transações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Operações Fechadas</h1>
              <p className="text-sm text-gray-600">Histórico de transações realizadas</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Resultado Total</p>
                <p className={`text-2xl font-bold ${totalResult >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                  {formatCurrency(totalResult)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">IR Devido</p>
                <p className="text-2xl font-bold text-brand-blue">{formatCurrency(totalTaxDue)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por ticker..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter buttons */}
              <div className="flex space-x-2">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                  className={filterType === "all" ? "bg-brand-blue hover:bg-blue-700" : ""}
                >
                  Todas
                </Button>
                <Button
                  variant={filterType === "buy" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("buy")}
                  className={filterType === "buy" ? "bg-brand-green hover:bg-green-700" : ""}
                >
                  Compras
                </Button>
                <Button
                  variant={filterType === "sell" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("sell")}
                  className={filterType === "sell" ? "bg-brand-red hover:bg-red-700" : ""}
                >
                  Vendas
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma transação encontrada</h3>
                  <p className="text-gray-600">
                    {searchTerm || filterType !== "all"
                      ? "Tente ajustar os filtros de busca"
                      : "Suas operações fechadas aparecerão aqui"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTransactions.map((transaction) => (
              <Card key={transaction.id} className="border-0 shadow-sm">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
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
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-gray-900">{transaction.ticker}</h3>
                          <Badge variant={transaction.operation === "buy" ? "secondary" : "destructive"}>
                            {transaction.operation === "buy" ? "Compra" : "Venda"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {transaction.quantity} ações • {formatCurrency(transaction.price)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(transaction.date).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {transaction.result !== undefined && (
                        <p className={`font-medium ${transaction.result >= 0 ? "text-brand-green" : "text-brand-red"}`}>
                          {transaction.result >= 0 ? "+" : ""}
                          {formatCurrency(transaction.result)}
                        </p>
                      )}
                      {transaction.tax_due !== undefined && transaction.tax_due > 0 && (
                        <p className="text-sm text-brand-blue">IR: {formatCurrency(transaction.tax_due)}</p>
                      )}
                      <p className="text-xs text-gray-500">Taxas: {formatCurrency(transaction.fees)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Export Button */}
        {filteredTransactions.length > 0 && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              toast({
                title: "Exportação em desenvolvimento",
                description: "A funcionalidade de exportar será implementada em breve",
              })
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Relatório
          </Button>
        )}
      </div>
    </div>
  )
}
