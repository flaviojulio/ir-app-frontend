"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Settings, Trash2, AlertTriangle, DollarSign } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

interface AdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDataCleared: () => void
}

export function AdminModal({ open, onOpenChange, onDataCleared }: AdminModalProps) {
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearConfirmText, setClearConfirmText] = useState("")
  const [taxLimit, setTaxLimit] = useState("20000")
  const [currency, setCurrency] = useState("BRL")
  const { toast } = useToast()

  const handleClearData = async () => {
    if (clearConfirmText !== "LIMPAR") {
      toast({
        title: "Confirmação incorreta",
        description: "Digite 'LIMPAR' para confirmar",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/reset", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Dados limpos!",
          description: "Todos os dados foram removidos com sucesso",
        })
        onDataCleared()
        setShowClearConfirm(false)
        setClearConfirmText("")
        onOpenChange(false)
      } else {
        throw new Error("Erro ao limpar dados")
      }
    } catch (error) {
      toast({
        title: "Erro ao limpar dados",
        description: "Não foi possível limpar os dados",
        variant: "destructive",
      })
    }
  }

  const handleSaveSettings = () => {
    // Simular salvamento de configurações
    toast({
      title: "Configurações salvas!",
      description: "Suas preferências foram atualizadas",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Settings className="mr-2 h-5 w-5 text-brand-blue" />
            Configurações
          </DialogTitle>
          <DialogDescription>Gerencie suas configurações e dados</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configurações de IR */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                Configurações de IR
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tax-limit">Limite de Isenção (R$)</Label>
                <Input
                  id="tax-limit"
                  type="number"
                  value={taxLimit}
                  onChange={(e) => setTaxLimit(e.target.value)}
                  placeholder="20000"
                />
                <p className="text-xs text-gray-600">Valor atual: {formatCurrency(20000)}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                >
                  <option value="BRL">Real Brasileiro (R$)</option>
                </select>
              </div>

              <Button onClick={handleSaveSettings} className="w-full bg-brand-blue hover:bg-blue-700">
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* Limpar Dados */}
          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center text-red-700">
                <Trash2 className="mr-2 h-4 w-4" />
                Zona de Perigo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showClearConfirm ? (
                <div>
                  <p className="text-sm text-gray-600 mb-3">
                    Remove todas as operações, resultados e dados da carteira. Esta ação não pode ser desfeita.
                  </p>
                  <Button onClick={() => setShowClearConfirm(true)} variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Limpar Todos os Dados
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Esta ação é irreversível!</span>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-text">Digite "LIMPAR" para confirmar:</Label>
                    <Input
                      id="confirm-text"
                      value={clearConfirmText}
                      onChange={(e) => setClearConfirmText(e.target.value)}
                      placeholder="LIMPAR"
                      className="border-red-300 focus:border-red-500"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => {
                        setShowClearConfirm(false)
                        setClearConfirmText("")
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleClearData}
                      variant="destructive"
                      className="flex-1"
                      disabled={clearConfirmText !== "LIMPAR"}
                    >
                      Confirmar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
