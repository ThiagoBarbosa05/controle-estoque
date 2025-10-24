"use client";

import { useState } from "react";
import {
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  Wine,
  MapPin,
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { removeWineFromCustomer } from "@/app/actions/customer-wines/basic-operations";
import type {
  CustomerWineWithDetails,
  CustomerWinesSortBy,
  SortOrder,
} from "@/types/customer-wines";

interface CustomerWinesTableProps {
  customerWines: CustomerWineWithDetails[];
  sortBy?: CustomerWinesSortBy;
  sortOrder?: SortOrder;
  customerId: string;
}

export function CustomerWinesTable({
  customerWines,
  sortBy = "addedAt",
  sortOrder = "desc",
  customerId,
}: CustomerWinesTableProps) {
  const router = useRouter();
  const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>(
    {}
  );
  const [selectedWines, setSelectedWines] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    wine?: { id: string; name: string };
  }>({ isOpen: false });

  const handleSort = (column: CustomerWinesSortBy) => {
    const newOrder = sortBy === column && sortOrder === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(window.location.search);
    params.set("sortBy", column);
    params.set("sortOrder", newOrder);
    router.push(`?${params.toString()}`);
  };

  const handleSelectWine = (wineId: string, selected: boolean) => {
    const newSelected = new Set(selectedWines);
    if (selected) {
      newSelected.add(wineId);
    } else {
      newSelected.delete(wineId);
    }
    setSelectedWines(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedWines(new Set(customerWines.map((wine) => wine.id)));
    } else {
      setSelectedWines(new Set());
    }
  };

  const handleRemoveWine = async (wineId: string, wineName: string) => {
    const actionKey = `remove-${wineId}`;
    setLoadingActions((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const result = await removeWineFromCustomer({
        customerId,
        wineId,
      });

      if (result.success) {
        toast.success(`${wineName} removido da lista com sucesso`);
        setDeleteConfirmation({ isOpen: false });
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao remover vinho da lista");
      }
    } catch (error) {
      console.error("Erro ao remover vinho:", error);
      toast.error("Erro interno. Tente novamente.");
    } finally {
      setLoadingActions((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const openDeleteConfirmation = (wine: { id: string; name: string }) => {
    setDeleteConfirmation({ isOpen: true, wine });
  };

  const getStockBadgeVariant = (stock: number) => {
    if (stock === 0) return "destructive";
    if (stock <= 5) return "secondary";
    return "default";
  };

  const getStockIcon = (stock: number) => {
    if (stock === 0) return <AlertCircle className="h-3 w-3" />;
    if (stock <= 5) return <Package className="h-3 w-3" />;
    return <CheckCircle2 className="h-3 w-3" />;
  };

  const SortButton = ({
    column,
    children,
  }: {
    column: CustomerWinesSortBy;
    children: React.ReactNode;
  }) => {
    const isActive = sortBy === column;
    return (
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className={`h-auto p-2 font-semibold hover:bg-muted/50 transition-colors ${
          isActive ? "bg-muted text-primary" : ""
        }`}
      >
        {children}
        <ArrowUpDown
          className={`ml-2 h-4 w-4 transition-transform ${
            isActive && sortOrder === "desc" ? "rotate-180" : ""
          }`}
        />
      </Button>
    );
  };

  if (customerWines.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Wine className="h-10 w-10 text-muted-foreground" />
            </div>

            <h3 className="mt-6 text-xl font-semibold">
              Nenhum vinho encontrado
            </h3>
            <p className="mb-6 mt-2 text-center text-sm leading-6 text-muted-foreground">
              Este cliente ainda não possui vinhos em sua lista ou nenhum vinho
              atende aos filtros aplicados. Adicione alguns vinhos para começar.
            </p>

            <Button>
              <Wine className="mr-2 h-4 w-4" />
              Adicionar Primeiro Vinho
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com ações em lote */}
      {selectedWines.size > 0 && (
        <Card className="bg-muted/30 border-primary/20">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedWines.size} vinho(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedWines(new Set())}
                >
                  Limpar seleção
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={selectedWines.size === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover selecionados
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela principal */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wine className="h-5 w-5 text-primary" />
              Vinhos do Cliente
              <Badge variant="secondary" className="ml-2">
                {customerWines.length}
              </Badge>
            </CardTitle>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                Total em estoque:{" "}
                {customerWines.reduce(
                  (acc, item) => acc + item.wine.inStock,
                  0
                )}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Tabela responsiva */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      className="rounded border border-input bg-background"
                      checked={
                        selectedWines.size === customerWines.length &&
                        customerWines.length > 0
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <SortButton column="wineName">
                      <Wine className="h-4 w-4 mr-2" />
                      Nome do Vinho
                    </SortButton>
                  </TableHead>
                  <TableHead className="hidden md:table-cell min-w-[120px]">
                    <SortButton column="wineCountry">
                      <MapPin className="h-4 w-4 mr-2" />
                      País
                    </SortButton>
                  </TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[100px]">
                    <SortButton column="wineType">Tipo</SortButton>
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    Tamanho
                  </TableHead>
                  <TableHead className="text-right min-w-[80px]">
                    <Package className="h-4 w-4 mr-2 inline" />
                    Estoque
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="w-[70px] text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerWines.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      selectedWines.has(item.id)
                        ? "bg-muted/30 border-l-4 border-l-primary"
                        : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <TableCell>
                      <input
                        type="checkbox"
                        className="rounded border border-input bg-background"
                        checked={selectedWines.has(item.id)}
                        onChange={(e) =>
                          handleSelectWine(item.id, e.target.checked)
                        }
                      />
                    </TableCell>

                    {/* Nome do vinho */}
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {item.wine.name}
                        </span>
                        {/* Info mobile - visível apenas em telas pequenas */}
                        <div className="md:hidden text-xs text-muted-foreground mt-1 space-y-1">
                          {item.wine.country && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {item.wine.country}
                            </div>
                          )}
                          {item.wine.type && (
                            <span className="inline-block bg-muted px-2 py-0.5 rounded text-xs">
                              {item.wine.type}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* País - oculto em mobile */}
                    <TableCell className="hidden md:table-cell">
                      {item.wine.country ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{item.wine.country}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Tipo - oculto em tablet */}
                    <TableCell className="hidden lg:table-cell">
                      {item.wine.type ? (
                        <Badge variant="outline" className="font-normal">
                          {item.wine.type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Tamanho - oculto em desktop pequeno */}
                    <TableCell className="hidden xl:table-cell">
                      {item.wine.size ? (
                        <span className="text-sm">{item.wine.size}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Estoque */}
                    <TableCell className="text-right">
                      <Badge
                        variant={getStockBadgeVariant(item.wine.inStock)}
                        className="flex items-center gap-1 w-fit ml-auto"
                      >
                        {getStockIcon(item.wine.inStock)}
                        {item.wine.inStock}
                      </Badge>
                    </TableCell>

                    {/* Status - oculto em mobile */}
                    <TableCell className="hidden sm:table-cell">
                      {item.wine.discontinued ? (
                        <Badge
                          variant="destructive"
                          className="flex items-center gap-1 w-fit"
                        >
                          <AlertCircle className="h-3 w-3" />
                          Descontinuado
                        </Badge>
                      ) : (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1 w-fit"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </Badge>
                      )}
                    </TableCell>

                    {/* Ações */}
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-muted transition-colors"
                          >
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem className="cursor-pointer">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              openDeleteConfirmation({
                                id: item.wine.id,
                                name: item.wine.name,
                              })
                            }
                            disabled={loadingActions[`remove-${item.wine.id}`]}
                            className="text-destructive cursor-pointer focus:text-destructive"
                          >
                            {loadingActions[`remove-${item.wine.id}`] ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Removendo...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remover da lista
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de confirmação simplificado */}
      {deleteConfirmation.isOpen && deleteConfirmation.wine && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Confirmar Remoção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tem certeza que deseja remover{" "}
                <strong>{deleteConfirmation.wine.name}</strong> da lista do
                cliente?
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmation({ isOpen: false })}
                  disabled={
                    loadingActions[`remove-${deleteConfirmation.wine.id}`]
                  }
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (deleteConfirmation.wine) {
                      handleRemoveWine(
                        deleteConfirmation.wine.id,
                        deleteConfirmation.wine.name
                      );
                    }
                  }}
                  disabled={
                    deleteConfirmation.wine
                      ? loadingActions[`remove-${deleteConfirmation.wine.id}`]
                      : true
                  }
                >
                  {deleteConfirmation.wine &&
                  loadingActions[`remove-${deleteConfirmation.wine.id}`] ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Removendo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remover
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
