"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Upload,
  Settings,
  PieChart,
  BarChart3,
  Calendar,
  AlertTriangle,
  Plus,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils"
import { apiClient } from "@/lib/api"
import { PortfolioChart } from "@/components/portfolio-chart"
import { RecentTransactions } from "@/components/recent-transactions"
import { UploadModal } from "@/components/upload-modal"
import { Sidebar } from "@/components/sidebar"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface DashboardData {
  portfolio: {
    total_value: number
    daily_variation: number
    daily_variation_percent: number
  }
  carteira: Array<{
    ticker: string
    quantidade: number
    preco_medio: number
    valor_total: number
  }>
  resultados: Array<{
    mes: string
    vendas_swing: number
    ir_devido: number
  }>
  darfs: Array<{
    codigo: string
    valor: number
    vencimento: string
  }>
}

export default function DashboardPage() {
  const { user, isLoading: authIsLoading, isAuthenticated } = useAuth()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (isAuthenticated && !authIsLoading) {
      fetchDashboardData()
    } else if (!authIsLoading && !isAuthenticated) {
      // AuthGuard should handle redirect, but good to prevent API calls
      setLoading(false) 
    }
  }, [isAuthenticated, authIsLoading])

  const fetchDashboardData = async () => {
    setLoading(true) // Ensure loading is true when fetching starts
    try {
      const [carteira, resultados, darfs] = await Promise.all([
        apiClient.get<DashboardData["carteira"]>("/api/carteira"),
        apiClient.get<DashboardData["resultados"]>("/api/resultados"),
        apiClient.get<DashboardData["darfs"]>("/api/darfs"),
      ])

      const totalValue = carteira.reduce((sum: number, item: any) => sum + item.quantidade * item.preco_medio, 0)

      const currentMonth = new Date().toISOString().slice(0, 7)
      const currentResult = resultados.find((r: any) => r.mes === currentMonth)

      setData({
        portfolio: {
          total_value: totalValue,
          daily_variation: Math.random() * 2000 - 1000, // Simulado
          daily_variation_percent: (Math.random() - 0.5) * 4,
        },
        carteira,
        resultados,
        darfs,
      })
    } catch (error) {
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (authIsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (loading && isAuthenticated) { // Only show data loading if authenticated
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not loading auth, AuthGuard should have redirected.
  // If it hasn't for some reason, or to prevent flicker, we can show minimal UI or null.
  // For now, if data is null (which it would be if not authenticated), many parts of the UI will be empty or show defaults.
  // This assumes AuthGuard is primary mechanism for redirecting unauthenticated users.
  if (!isAuthenticated) {
    // Optionally, redirect here or show a message, though AuthGuard is preferred.
    // For example: router.push('/login');
    return null; // Or a more specific "not authenticated" message
  }

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentResult = data?.resultados.find((r) => r.mes === currentMonth)
  const taxExemptionUsed = ((currentResult?.vendas_swing || 0) / 20000) * 100
  const pendingDarf = data?.darfs.find((d) => new Date(d.vencimento) > new Date())

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Olá, {user?.nome_completo?.split(" ")[0] || user?.username}! 👋
              </h1>
              <p className="text-muted-foreground">Aqui está o resumo da sua carteira hoje</p>
            </div>
            <Button onClick={() => setShowUpload(true)} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar Operações
            </Button>
          </div>

          {/* Portfolio Overview */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data?.portfolio.total_value || 0)}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  {(data?.portfolio.daily_variation || 0) >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-600" />
                  )}
                  <span className={(data?.portfolio.daily_variation || 0) >= 0 ? "text-green-600" : "text-red-600"}>
                    {data?.portfolio.daily_variation_percent.toFixed(2)}% hoje
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ativos na Carteira</CardTitle>
                <PieChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data?.carteira.length || 0}</div>
                <p className="text-xs text-muted-foreground">Diferentes papéis</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Isenção IR</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{taxExemptionUsed.toFixed(1)}%</div>
                <Progress value={taxExemptionUsed} className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(20000 - (currentResult?.vendas_swing || 0))} restantes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">IR Devido</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(currentResult?.ir_devido || 0)}</div>
                {pendingDarf && (
                  <Badge variant="destructive" className="mt-2">
                    DARF Pendente
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* DARF Alert */}
          {pendingDarf && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-orange-900">
                      DARF Pendente - Vencimento em{" "}
                      {Math.ceil(
                        (new Date(pendingDarf.vencimento).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
                      )}{" "}
                      dias
                    </h3>
                    <p className="text-sm text-orange-700 mt-1">Valor: {formatCurrency(pendingDarf.valor)}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Gerar DARF
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts and Tables */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Composição da Carteira
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PortfolioChart data={data?.carteira || []} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Operações Recentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentTransactions />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Plus className="h-5 w-5" />
                  Nova Operação
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <FileText className="h-5 w-5" />
                  Relatórios
                </Button>
                <Button variant="outline" className="h-20 flex-col gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <UploadModal open={showUpload} onOpenChange={setShowUpload} onSuccess={fetchDashboardData} />
    </div>
  )
}
