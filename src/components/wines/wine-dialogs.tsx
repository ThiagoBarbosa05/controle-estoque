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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, AlertTriangle } from "lucide-react";
import { useWineActions } from "@/hooks/use-wine-actions";
import type { Wine } from "@/app/actions/wines";

// Tipos de vinho disponíveis
const WINE_TYPES = [
  "Tinto",
  "Branco",
  "Rosé",
  "Espumante",
  "Fortificado",
  "Sobremesa",
] as const;

// Tamanhos de garrafa disponíveis
const WINE_SIZES = [
  "187ml",
  "375ml",
  "750ml",
  "1L",
  "1.5L",
  "3L",
  "6L",
] as const;

interface WineFormData {
  name: string;
  country: string;
  type: string;
  size: string;
  inStock: string;
  discontinued: boolean;
}

interface WineFormDialogProps {
  wine?: Wine;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function WineFormDialog({
  wine,
  onOpenChange,
  trigger,
}: WineFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<WineFormData>({
    name: wine?.name || "",
    country: wine?.country || "",
    type: wine?.type || "",
    size: wine?.size || "",
    inStock: wine?.inStock || "0",
    discontinued: wine?.discontinued || false,
  });
  const [error, setError] = useState<string>("");

  const { handleCreateWine, handleUpdateWine, isPending } = useWineActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);

    if (!newOpen) {
      setError("");
      if (!wine) {
        setFormData({
          name: "",
          country: "",
          type: "",
          size: "",
          inStock: "0",
          discontinued: false,
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name.trim() ||
      !formData.country.trim() ||
      !formData.type ||
      !formData.size
    ) {
      setError("Preencha todos os campos obrigatórios");
      return;
    }

    const wineData = {
      name: formData.name,
      country: formData.country,
      type: formData.type as
        | "Tinto"
        | "Branco"
        | "Rosé"
        | "Espumante"
        | "Fortificado"
        | "Sobremesa",
      size: formData.size as
        | "187ml"
        | "375ml"
        | "750ml"
        | "1L"
        | "1.5L"
        | "3L"
        | "6L",
      inStock: formData.inStock,
      discontinued: formData.discontinued,
    };

    const result = wine
      ? await handleUpdateWine({ id: wine.id, ...wineData })
      : await handleCreateWine(wineData);

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao salvar vinho");
    }
  };

  const handleInputChange = (
    field: keyof WineFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{wine ? "Editar Vinho" : "Novo Vinho"}</DialogTitle>
            <DialogDescription>
              {wine
                ? "Altere as informações do vinho abaixo."
                : "Preencha as informações para cadastrar um novo vinho."}
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
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ex: Château Margaux 2010"
                disabled={isPending}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">País *</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Ex: França"
                disabled={isPending}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {WINE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="size">Tamanho *</Label>
                <Select
                  value={formData.size}
                  onValueChange={(value) => handleInputChange("size", value)}
                  disabled={isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {WINE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="inStock">Estoque</Label>
              <Input
                id="inStock"
                type="number"
                min="0"
                value={formData.inStock}
                onChange={(e) => handleInputChange("inStock", e.target.value)}
                disabled={isPending}
              />
            </div>

            {wine && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="discontinued"
                  checked={formData.discontinued}
                  onChange={(e) =>
                    handleInputChange("discontinued", e.target.checked)
                  }
                  disabled={isPending}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="discontinued" className="text-sm">
                  Marcar como descontinuado
                </Label>
              </div>
            )}
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
              {isPending ? "Salvando..." : wine ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteWineDialogProps {
  wine: Wine;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function DeleteWineDialog({
  wine,
  onOpenChange,
  trigger,
}: DeleteWineDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleDeleteWine, isPending } = useWineActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);

    if (!newOpen) {
      setError("");
    }
  };

  const handleDelete = async () => {
    setError("");

    const result = await handleDeleteWine(wine.id);

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao excluir vinho");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Vinho
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o vinho <strong>{wine.name}</strong>?
            Esta ação irá marcá-lo como descontinuado.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componentes de botões com os diálogos integrados
export function AddWineButton() {
  return (
    <WineFormDialog
      trigger={
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Vinho
        </Button>
      }
    />
  );
}

export function EditWineButton({ wine }: { wine: Wine }) {
  return (
    <WineFormDialog
      wine={wine}
      trigger={
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      }
    />
  );
}

export function DeleteWineButton({ wine }: { wine: Wine }) {
  return (
    <DeleteWineDialog
      wine={wine}
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Excluir
        </Button>
      }
    />
  );
}
