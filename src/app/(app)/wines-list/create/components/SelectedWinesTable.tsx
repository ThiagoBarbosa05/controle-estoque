"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Wine as WineIcon, Package, Trash2 } from "lucide-react";
import { useWineSelection } from "./WineSelectionContext";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

export function SelectedWinesTable() {
  const { selectedWines, toggleWine, clearSelection } = useWineSelection();

  const sortedSelectedWines = useMemo(() => {
    return [...selectedWines].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedWines]);

  if (selectedWines.length === 0) {
    return (
      <div className="text-center py-8 border rounded-lg bg-muted/30">
        <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Nenhum vinho selecionado ainda
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Selecione vinhos da lista abaixo para adicionar à lista do cliente
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg bg-gradient-to-r from-primary/5 to-purple/5 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Vinhos Selecionados</h3>
            <p className="text-xs text-muted-foreground">
              {selectedWines.length} item{selectedWines.length !== 1 ? "s" : ""}{" "}
              pronto{selectedWines.length !== 1 ? "s" : ""} para adicionar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {selectedWines.length}
          </Badge>
          {selectedWines.length > 1 && (
            <Button
              size="sm"
              variant="outline"
              onClick={clearSelection}
              className="h-8 px-2 text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      <div className="overflow-hidden border rounded-lg bg-background">
        {/* Mobile Layout */}
        <div className="md:hidden space-y-2 p-2">
          {sortedSelectedWines.map((wine, index) => (
            <div
              key={wine.id}
              className={cn(
                "p-3 rounded-lg border bg-card",
                "hover:bg-muted/50 transition-colors",
                index === 0 && "border-primary/20 bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <WineIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <h4 className="font-medium text-sm truncate">
                      {wine.name}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {wine.country || "N/A"}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {wine.type || "N/A"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Estoque:
                    </span>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        wine.inStock === 0
                          ? "text-destructive"
                          : wine.inStock <= wine.minStock
                          ? "text-yellow-600"
                          : "text-green-600"
                      )}
                    >
                      {wine.inStock}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleWine(wine)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                  title="Remover da seleção"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">
                    Remover {wine.name} da seleção
                  </span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Layout */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Vinho</TableHead>
                <TableHead className="font-semibold">País</TableHead>
                <TableHead className="font-semibold">Tipo</TableHead>
                <TableHead className="font-semibold">Estoque</TableHead>
                <TableHead className="w-12 text-center">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSelectedWines.map((wine, index) => (
                <TableRow
                  key={wine.id}
                  className={cn(
                    "hover:bg-muted/50 transition-colors",
                    index === 0 && "bg-primary/5"
                  )}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3 min-w-0">
                      <WineIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">{wine.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {wine.country || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {wine.type || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-sm font-medium",
                        wine.inStock === 0
                          ? "text-destructive"
                          : wine.inStock <= wine.minStock
                          ? "text-yellow-600"
                          : "text-green-600"
                      )}
                    >
                      {wine.inStock}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleWine(wine)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Remover da seleção"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">
                        Remover {wine.name} da seleção
                      </span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
