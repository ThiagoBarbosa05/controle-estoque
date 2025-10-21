import type { WineSelection } from "./WineSelection.types";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Wine as WineIcon, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWineSelection } from "./WineSelectionContext";
import { useMemo, useState, useCallback } from "react";

interface Props {
  wines: WineSelection[];
  loading?: boolean;
  onSelectAll?: (wines: WineSelection[]) => void;
}

type SortField = "name" | "country" | "type" | "inStock";
type SortOrder = "asc" | "desc";

export function WineSelectionTable({ wines, loading, onSelectAll }: Props) {
  const { selectedWineIds, toggleWine } = useWineSelection();
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = useCallback((field: SortField) => {
    setSortField(field);
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  const sortedWines = useMemo(() => {
    const sorted = [...wines].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      const aStr = (typeof aVal === "string" ? aVal.toLowerCase() : aVal) ?? "";
      const bStr = (typeof bVal === "string" ? bVal.toLowerCase() : bVal) ?? "";

      if (aStr < bStr) return sortOrder === "asc" ? -1 : 1;
      if (aStr > bStr) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [wines, sortField, sortOrder]);

  const handleSelectAll = useCallback(() => {
    onSelectAll?.(wines);
  }, [wines, onSelectAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin mr-2">⏳</div>
        <span className="text-muted-foreground">Carregando vinhos...</span>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 inline" />
    );
  };

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table className="min-w-[400px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={
                  selectedWineIds.size === wines.length && wines.length > 0
                }
                onCheckedChange={handleSelectAll}
                aria-label="Selecionar todos"
              />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("name")}
            >
              Vinho <SortIcon field="name" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("country")}
            >
              País <SortIcon field="country" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("type")}
            >
              Tipo <SortIcon field="type" />
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => handleSort("inStock")}
            >
              Estoque <SortIcon field="inStock" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedWines.length > 0 ? (
            sortedWines.map((wine) => (
              <TableRow
                key={wine.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-muted/50",
                  selectedWineIds.has(wine.id) && "bg-muted/50"
                )}
                onClick={() => toggleWine(wine)}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedWineIds.has(wine.id)}
                    onCheckedChange={() => toggleWine(wine)}
                    aria-label={`Selecionar ${wine.name}`}
                  />
                </TableCell>
                <TableCell className="font-medium truncate max-w-xs">
                  <div className="flex items-center gap-2">
                    <WineIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{wine.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  <Badge variant="outline" className="text-xs">
                    {wine.country || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  <Badge variant="secondary" className="text-xs">
                    {wine.type || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-medium">
                  <span
                    className={cn(
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
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-8 text-muted-foreground"
              >
                Nenhum vinho disponível.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
