"use client";

import { useState } from "react";
import { Trash2, Loader2, Users } from "lucide-react";
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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { bulkRemoveWinesFromCustomer } from "@/app/actions/customer-wines/bulk-operations";
import type { CustomerWineWithDetails } from "@/types/customer-wines";

interface BulkRemoveWinesProps {
  customerId: string;
  selectedWines: CustomerWineWithDetails[];
  onSelectionClear: () => void;
}

export function BulkRemoveWines({
  customerId,
  selectedWines,
  onSelectionClear,
}: BulkRemoveWinesProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    setLoading(true);

    try {
      const wineIds = selectedWines.map((wine) => wine.wineId);
      const result = await bulkRemoveWinesFromCustomer({
        customerId,
        wineIds,
      });

      if (result.success) {
        toast.success(
          `${selectedWines.length} vinho(s) removido(s) da lista com sucesso`
        );
        setOpen(false);
        onSelectionClear();
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao remover vinhos");
      }
    } catch (error) {
      console.error("Erro ao remover vinhos:", error);
      toast.error("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (selectedWines.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Remover Selecionados ({selectedWines.length})
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Remover Vinhos da Lista
          </DialogTitle>
          <DialogDescription>
            Você está prestes a remover {selectedWines.length} vinho(s) da lista
            do cliente. Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="max-h-48 overflow-y-auto">
            <h4 className="font-medium mb-2">Vinhos a serem removidos:</h4>
            <ul className="space-y-2">
              {selectedWines.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                >
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{item.wine.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.wine.type && item.wine.country
                        ? `${item.wine.type} - ${item.wine.country}`
                        : item.wine.type || item.wine.country || "—"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Removendo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Remover {selectedWines.length} Vinho(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
