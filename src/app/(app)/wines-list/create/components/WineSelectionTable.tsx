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
import { Button } from "@/components/ui/button";
import {
  Wine as WineIcon,
  ChevronUp,
  ChevronDown,
  Package,
  Loader2,
  Check,
} from "lucide-react";
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

  const isAllSelected =
    selectedWineIds.size === wines.length && wines.length > 0;
  const isIndeterminate =
    selectedWineIds.size > 0 && selectedWineIds.size < wines.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 border rounded-lg bg-muted/30">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Carregando vinhos disponíveis...
          </p>
        </div>
      </div>
    );
  }

  if (wines.length === 0) {
    return (
      <div className="text-center py-16 border rounded-lg bg-muted/30">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-sm mb-1">Nenhum vinho encontrado</h3>
        <p className="text-xs text-muted-foreground">
          Tente ajustar os filtros de pesquisa ou adicione novos vinhos ao
          sistema
        </p>
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
    <div className="space-y-4">
      {/* Header com informações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm">Vinhos Disponíveis</h4>
          <Badge variant="outline" className="text-xs">
            {wines.length} {wines.length === 1 ? "item" : "itens"}
          </Badge>
        </div>
        {wines.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleSelectAll}
            className="h-8 text-xs"
          >
            {isAllSelected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Desmarcar todos
              </>
            ) : (
              <>Selecionar todos</>
            )}
          </Button>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden space-y-3">
        {sortedWines.map((wine) => (
          <button
            key={wine.id}
            type="button"
            className={cn(
              "w-full p-4 rounded-lg border bg-card cursor-pointer text-left",
              "hover:bg-accent/50 hover:border-accent-foreground/20",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20",
              selectedWineIds.has(wine.id) && "bg-primary/5 border-primary/20"
            )}
            onClick={() => toggleWine(wine)}
            aria-label={`Selecionar vinho ${wine.name}`}
          >
            <div className="flex items-start gap-3">
              <Checkbox
                checked={selectedWineIds.has(wine.id)}
                onCheckedChange={() => toggleWine(wine)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
                aria-label={`Selecionar ${wine.name}`}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <WineIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <h4 className="font-medium text-sm truncate">{wine.name}</h4>
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
            </div>
          </button>
        ))}
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-background">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={isAllSelected}
                  ref={(ref) => {
                    if (ref && typeof ref !== "function") {
                      const checkboxElement = ref as HTMLInputElement;
                      checkboxElement.indeterminate = isIndeterminate;
                    }
                  }}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todos os vinhos"
                />
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer hover:bg-muted/70 transition-colors font-semibold",
                  "select-none"
                )}
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Vinho <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer hover:bg-muted/70 transition-colors font-semibold",
                  "select-none"
                )}
                onClick={() => handleSort("country")}
              >
                <div className="flex items-center">
                  País <SortIcon field="country" />
                </div>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer hover:bg-muted/70 transition-colors font-semibold",
                  "select-none"
                )}
                onClick={() => handleSort("type")}
              >
                <div className="flex items-center">
                  Tipo <SortIcon field="type" />
                </div>
              </TableHead>
              <TableHead
                className={cn(
                  "cursor-pointer hover:bg-muted/70 transition-colors font-semibold",
                  "select-none"
                )}
                onClick={() => handleSort("inStock")}
              >
                <div className="flex items-center">
                  Estoque <SortIcon field="inStock" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedWines.map((wine) => (
              <TableRow
                key={wine.id}
                className={cn(
                  "cursor-pointer transition-colors hover:bg-accent/50",
                  selectedWineIds.has(wine.id) && "bg-primary/5"
                )}
                onClick={() => toggleWine(wine)}
              >
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  className="text-center"
                >
                  <Checkbox
                    checked={selectedWineIds.has(wine.id)}
                    onCheckedChange={() => toggleWine(wine)}
                    aria-label={`Selecionar ${wine.name}`}
                  />
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
