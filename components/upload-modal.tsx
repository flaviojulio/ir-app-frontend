"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Upload, CheckCircle, X } from "lucide-react"
import { useDropzone } from "react-dropzone"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface UploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function UploadModal({ open, onOpenChange, onSuccess }: UploadModalProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const { toast } = useToast()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        if (file.type === "application/json" || file.name.endsWith(".json")) {
          setUploadedFile(file)
        } else {
          toast({
            title: "Formato inválido",
            description: "Por favor, envie apenas arquivos JSON",
            variant: "destructive",
          })
        }
      }
    },
    [toast],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
  })

  const handleUpload = async () => {
    if (!uploadedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", uploadedFile)

      const token = localStorage.getItem("token")
      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Upload realizado com sucesso!",
          description: result.mensagem,
        })
        onSuccess()
        onOpenChange(false)
        setUploadedFile(null)
      } else {
        const error = await response.json()
        toast({
          title: "Erro no upload",
          description: error.detail || "Erro ao processar arquivo",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível enviar o arquivo",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Operações</DialogTitle>
          <DialogDescription>Envie um arquivo JSON com suas operações de compra e venda</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              {isDragActive ? (
                <p className="text-primary font-medium">Solte o arquivo aqui...</p>
              ) : (
                <div>
                  <p className="text-foreground mb-2">Arraste e solte seu arquivo JSON aqui</p>
                  <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                </div>
              )}
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">{uploadedFile.name}</p>
                    <p className="text-sm text-green-700">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={removeFile}
                  className="text-green-700 hover:text-green-900"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Formato esperado */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Formato esperado:</h4>
            <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
              {`[
  {
    "date": "2025-01-10",
    "ticker": "ITUB4",
    "operation": "buy",
    "quantity": 1000,
    "price": 19.0,
    "fees": 2.0
  }
]`}
            </pre>
          </div>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!uploadedFile || uploading} className="flex-1">
              {uploading ? "Enviando..." : "Enviar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
