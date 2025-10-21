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
import { X, Wine as WineIcon } from "lucide-react";
import { useWineSelection } from "./WineSelectionContext";
import { useMemo } from "react";

export function SelectedWinesTable() {
  const { selectedWines, toggleWine } = useWineSelection();

  const sortedSelectedWines = useMemo(() => {
    return [...selectedWines].sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedWines]);

  if (selectedWines.length === 0) return null;

  return (
    <div className="border rounded-lg bg-muted/50 p-4 space-y-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Vinhos Selecionados</h3>
          <Badge variant="secondary" className="text-xs">
            {selectedWines.length}
          </Badge>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-md">
        <Table className="min-w-[400px]">
          <TableHeader>
            <TableRow>
              <TableHead>Vinho</TableHead>
              <TableHead>País</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estoque</TableHead>
              <TableHead className="w-12">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSelectedWines.map((wine) => (
              <TableRow
                key={wine.id}
                className="hover:bg-muted/75 transition-colors"
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
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
                <TableCell className="text-sm">
                  {wine.inStock === 0 ? (
                    <span className="text-destructive font-medium">
                      {wine.inStock}
                    </span>
                  ) : wine.inStock <= wine.minStock ? (
                    <span className="text-yellow-600 font-medium">
                      {wine.inStock}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">
                      {wine.inStock}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleWine(wine)}
                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    title="Remover de seleção"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
