"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  exportLowStockWines,
  exportZeroStockWines,
} from "@/app/actions/wines-export";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WineExportButtons() {
  const [isExportingLowStock, setIsExportingLowStock] = useState(false);
  const [isExportingZeroStock, setIsExportingZeroStock] = useState(false);

  const handleExportLowStock = async () => {
    setIsExportingLowStock(true);
    try {
      const result = await exportLowStockWines();

      if (result.success && result.data) {
        // Criar um blob a partir do base64
        const byteCharacters = atob(result.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.mimeType });

        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Planilha exportada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao exportar planilha");
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar planilha");
    } finally {
      setIsExportingLowStock(false);
    }
  };

  const handleExportZeroStock = async () => {
    setIsExportingZeroStock(true);
    try {
      const result = await exportZeroStockWines();

      if (result.success && result.data) {
        // Criar um blob a partir do base64
        const byteCharacters = atob(result.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.data.mimeType });

        // Criar link de download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("Planilha exportada com sucesso!");
      } else {
        toast.error(result.error || "Erro ao exportar planilha");
      }
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast.error("Erro ao exportar planilha");
    } finally {
      setIsExportingZeroStock(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Exportar Planilhas</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleExportLowStock}
          disabled={isExportingLowStock}
          className="cursor-pointer"
        >
          {isExportingLowStock ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">Estoque Baixo</span>
            <span className="text-xs text-muted-foreground">
              Vinhos abaixo do estoque mínimo
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportZeroStock}
          disabled={isExportingZeroStock}
          className="cursor-pointer"
        >
          {isExportingZeroStock ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          <div className="flex flex-col">
            <span className="font-medium">Estoque Zerado</span>
            <span className="text-xs text-muted-foreground">
              Vinhos sem estoque disponível
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
