"use client";

import { useActionState, useEffect, useState } from "react";
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
import { createWine } from "@/app/(app)/wines/actions/create-wine";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { toast } from "sonner";
import { updateWine } from "./actions/update-wine";

// Tipos de vinho disponíveis
export const WINE_TYPES = [
  "TINTO",
  "BRANCO",
  "ROSE",
  "ESPUMANTE",
  "FORTIFICADO",
  "SOBREMESA",
] as const;

// Tamanhos de garrafa disponíveis
export const WINE_SIZES = [
  "187ML",
  "375ML",
  "750ML",
  "1L",
  "1.5L",
  "3L",
  "6L",
] as const;

export const WINE_COUNTRIES = [
  "CHILE",
  "ARGENTINA",
  "ITALIA",
  "FRANÇA",
  "ALEMANHA",
  "URUGUAI",
  "PORTUGAL",
  "ESPANHA",
  "BRASIL",
  "ESTADOS UNIDOS",
  "NOVA ZELÂNDIA",
  "OUTROS",
] as const;

interface WineFormDialogProps {
  wine?: Wine;
  children?: React.ReactNode;
}

export function WineFormDialog({ wine, children }: WineFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [formState, formAction, isPending] = useActionState(
    wine ? updateWine.bind(null, wine.id) : createWine,
    EMPTY_FORM_STATE
  );

  useEffect(() => {
    if (formState.status === "SUCCESS") {
      setOpen(false);
      toast.success(formState.message);
    } else if (formState.status === "ERROR") {
      toast.error(formState.message || "Erro ao salvar vinho");
    }
  }, [formState]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{wine ? "Editar Vinho" : "Adicionar Vinho"}</DialogTitle>
          <DialogDescription>
            {wine
              ? "Atualize as informações do vinho."
              : "Preencha o formulário para adicionar um novo vinho."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ex: Château Margaux 2010"
                disabled={isPending}
                defaultValue={
                  formState.payload?.get("name")?.toString() || wine?.name || ""
                }
              />
              {formState.fieldErrors.name && (
                <p className="text-red-400 text-xs">
                  {formState.fieldErrors.name}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="country">País *</Label>
              <Select
                name="country"
                defaultValue={
                  formState.payload?.get("country")?.toString() ||
                  wine?.country ||
                  ""
                }
                disabled={isPending}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {WINE_COUNTRIES.map((country) => (
                    <SelectItem
                      className="capitalize"
                      key={country}
                      value={country}
                    >
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formState.fieldErrors.country && (
                <p className="text-red-400 text-xs">
                  {formState.fieldErrors.country}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  name="type"
                  disabled={isPending}
                  defaultValue={
                    formState.payload?.get("type")?.toString() ||
                    wine?.type ||
                    ""
                  }
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
                  disabled={isPending}
                  name="size"
                  defaultValue={
                    formState.payload?.get("size")?.toString() ||
                    wine?.size ||
                    ""
                  }
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
                name="inStock"
                disabled={isPending}
                defaultValue={
                  formState.payload?.get("inStock")?.toString() ||
                  wine?.inStock ||
                  "0"
                }
              />
            </div>

            {wine && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="discontinued"
                  name="discontinued"
                  className="rounded border-gray-300"
                  defaultChecked={wine.discontinued}
                />
                <Label htmlFor="discontinued" className="text-sm">
                  Marcar como descontinuado
                </Label>
              </div>
            )}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button disabled={isPending} type="submit">
            {isPending ? "Salvando..." : wine ? "Salvar" : "Criar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
