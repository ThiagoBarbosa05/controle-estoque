"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, AlertTriangle } from "lucide-react";
import { useWineActions } from "@/hooks/use-wine-actions";
import type { Wine } from "@/app/actions/wines";

interface QuickStockUpdateProps {
  wine: Wine;
  trigger?: React.ReactNode;
}

export function QuickStockUpdate({ wine, trigger }: QuickStockUpdateProps) {
  const [open, setOpen] = useState(false);
  const [stock, setStock] = useState(wine.inStock);
  const [error, setError] = useState<string>("");

  const { handleUpdateStock, isPending } = useWineActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
      setStock(wine.inStock);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!stock.trim() || parseInt(stock) < 0) {
      setError("Digite um valor válido para o estoque");
      return;
    }

    const result = await handleUpdateStock(wine.id, stock);

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao atualizar estoque");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Package className="h-4 w-4 mr-1" />
            Estoque
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Atualizar Estoque
            </DialogTitle>
            <DialogDescription>
              Altere a quantidade em estoque para <strong>{wine.name}</strong>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="stock">Quantidade em Estoque</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Digite a quantidade"
                disabled={isPending}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Estoque atual: {wine.inStock} unidades
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Atualizando..." : "Atualizar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
