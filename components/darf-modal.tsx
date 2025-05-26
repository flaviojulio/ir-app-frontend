"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Download, FileText, AlertCircle } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface DarfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DarfData {
  codigo: string
  competencia: string
  valor: number
  vencimento: string
}

export function DarfModal({ open, onOpenChange }: DarfModalProps) {
  const [darfs, setDarfs] = useState<DarfData[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchDarfs()
    }
  }, [open])

  const fetchDarfs = async () => {
    setLoading(true)
    try {
      // Simular dados de DARF (integrar com API real)
      const mockDarfs: DarfData[] = [
        {
          codigo: "6015",
          competencia: "2024-01",
          valor: 450.3,
          vencimento: "2024-02-29",
        },
      ]
      setDarfs(mockDarfs)
    } catch (error) {
      toast({
        title: "Erro ao carregar DARFs",
        description: "Não foi possível carregar os DARFs pendentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const generateDarf = (darf: DarfData) => {
    // Simular geração de DARF
    toast({
      title: "DARF gerado!",
      description: `DARF de ${formatCurrency(darf.valor)} foi gerado com sucesso`,
    })
  }

  const getDaysUntilDue = (vencimento: string) => {
    const dueDate = new Date(vencimento)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-brand-blue" />
            Gerar DARF
          </DialogTitle>
          <DialogDescription>Gere seus DARFs para pagamento do imposto de renda</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando DARFs...</p>
            </div>
          ) : darfs.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum DARF pendente</h3>
              <p className="text-gray-600">Você não possui DARFs para gerar no momento</p>
            </div>
          ) : (
            <div className="space-y-3">
              {darfs.map((darf, index) => {
                const daysLeft = getDaysUntilDue(darf.vencimento)
                const isUrgent = daysLeft <= 5

                return (
                  <Card
                    key={index}
                    className={`border-l-4 ${isUrgent ? "border-l-red-500 bg-red-50" : "border-l-blue-500"}`}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge variant={isUrgent ? "destructive" : "secondary"}>Código {darf.codigo}</Badge>
                            <span className="text-sm text-gray-600">Competência: {darf.competencia}</span>
                          </div>

                          <div>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(darf.valor)}</p>
                            <div className="flex items-center mt-1">
                              <Calendar className="h-4 w-4 text-gray-500 mr-1" />
                              <span className="text-sm text-gray-600">
                                Vence em {new Date(darf.vencimento).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>

                          {isUrgent && (
                            <div className="flex items-center text-red-600">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">{daysLeft} dias restantes!</span>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={() => generateDarf(darf)}
                          size="sm"
                          className="bg-brand-blue hover:bg-blue-700"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Gerar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Dica</h4>
            <p className="text-sm text-blue-800">
              O DARF pode ser pago até o último dia útil do mês seguinte ao da apuração. Não esqueça de guardar o
              comprovante!
            </p>
          </div>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
