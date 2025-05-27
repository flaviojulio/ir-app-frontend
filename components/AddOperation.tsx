"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, AlertCircle, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface AddOperationProps {
  onSuccess: () => void
}

export function AddOperation({ onSuccess }: AddOperationProps) {
  const [formData, setFormData] = useState({
    date: "",
    ticker: "",
    operation: "",
    quantity: "",
    price: "",
    fees: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Validação básica
      if (!formData.date || !formData.ticker || !formData.operation || !formData.quantity || !formData.price) {
        setError("Todos os campos obrigatórios devem ser preenchidos");
        toast({ title: "Erro de Validação", description: "Todos os campos obrigatórios devem ser preenchidos", variant: "destructive" });
        setLoading(false);
        return;
      }

      const quantityVal = Number.parseInt(formData.quantity);
      if (isNaN(quantityVal) || quantityVal <= 0) {
        setError("A quantidade deve ser um número inteiro maior que zero.");
        toast({ title: "Erro de Validação", description: "A quantidade deve ser um número inteiro maior que zero.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const priceVal = Number.parseFloat(formData.price.replace(",", "."));
      if (isNaN(priceVal) || priceVal <= 0) {
        setError("O preço deve ser um número maior que zero. Use ponto ou vírgula como separador decimal.");
        toast({ title: "Erro de Validação", description: "O preço deve ser um número maior que zero. Use ponto ou vírgula como separador decimal.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const feesVal = formData.fees ? Number.parseFloat(formData.fees.replace(",", ".")) : 0;
      if (isNaN(feesVal) || feesVal < 0) {
        setError("As taxas devem ser um número igual ou maior que zero. Use ponto ou vírgula como separador decimal.");
        toast({ title: "Erro de Validação", description: "As taxas devem ser um número igual ou maior que zero. Use ponto ou vírgula como separador decimal.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const operationData = {
        date: formData.date,
        ticker: formData.ticker.toUpperCase(),
        operation: formData.operation,
        quantity: quantityVal,
        price: priceVal,
        fees: feesVal,
      };

      await api.post("/operacoes", operationData);

      toast({
        title: "Sucesso!",
        description: "Operação adicionada com sucesso",
      })

      // Limpar formulário
      setFormData({
        date: "",
        ticker: "",
        operation: "",
        quantity: "",
        price: "",
        fees: "",
      })

      onSuccess()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error.message || "Erro ao adicionar operação"
      setError(errorMessage)
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Adicionar Nova Operação
        </CardTitle>
        <CardDescription>Registre manualmente uma operação de compra ou venda</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data da Operação *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker *</Label>
              <Input
                id="ticker"
                type="text"
                placeholder="Ex: ITUB4, PETR4"
                value={formData.ticker}
                onChange={(e) => handleInputChange("ticker", e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="operation">Tipo de Operação *</Label>
              <Select value={formData.operation} onValueChange={(value) => handleInputChange("operation", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">Compra</SelectItem>
                  <SelectItem value="sell">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ex: 100"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço por Ação *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="Ex: 25.50"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                min="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees">Taxas e Corretagem</Label>
              <Input
                id="fees"
                type="number"
                step="0.01"
                placeholder="Ex: 5.00"
                value={formData.fees}
                onChange={(e) => handleInputChange("fees", e.target.value)}
                min="0"
              />
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar Operação"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  date: "",
                  ticker: "",
                  operation: "",
                  quantity: "",
                  price: "",
                  fees: "",
                })
              }
            >
              Limpar
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Dicas importantes:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use sempre o ticker completo (ex: ITUB4, não ITUB)</li>
            <li>• O preço deve ser por ação individual</li>
            <li>• Inclua todas as taxas (corretagem, emolumentos, etc.)</li>
            <li>• A data deve ser a data de liquidação da operação</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
