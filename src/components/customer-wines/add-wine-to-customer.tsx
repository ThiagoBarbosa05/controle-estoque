"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { addWineToCustomer } from "@/app/actions/customer-wines/basic-operations";
import { getAvailableWinesForCustomer } from "@/lib/data/customer-wines";

interface AddWineToCustomerProps {
  customerId: string;
}

export function AddWineToCustomer({ customerId }: AddWineToCustomerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedWineId, setSelectedWineId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingWines, setLoadingWines] = useState(false);
  const [availableWines, setAvailableWines] = useState<
    {
      id: string;
      name: string;
      country: string | null;
      type: string | null;
    }[]
  >([]);

  const loadAvailableWines = async () => {
    setLoadingWines(true);
    try {
      const wines = await getAvailableWinesForCustomer(customerId);
      setAvailableWines(wines);
    } catch (error) {
      console.error("Erro ao carregar vinhos disponíveis:", error);
      toast.error("Erro ao carregar vinhos disponíveis");
    } finally {
      setLoadingWines(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && availableWines.length === 0) {
      loadAvailableWines();
    }
  };

  const handleSubmit = async () => {
    if (!selectedWineId) {
      toast.error("Selecione um vinho");
      return;
    }

    setLoading(true);
    try {
      const result = await addWineToCustomer({
        customerId,
        wineId: selectedWineId,
      });

      if (result.success) {
        const selectedWine = availableWines.find(
          (wine) => wine.id === selectedWineId
        );
        toast.success(`${selectedWine?.name} adicionado à lista com sucesso`);
        setOpen(false);
        setSelectedWineId("");
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao adicionar vinho");
      }
    } catch (error) {
      console.error("Erro ao adicionar vinho:", error);
      toast.error("Erro interno. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Vinho
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adicionar Vinho à Lista</DialogTitle>
          <DialogDescription>
            Selecione um vinho para adicionar à lista do cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="wine">Vinho</Label>
            {loadingWines ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando vinhos...
              </div>
            ) : (
              <Select value={selectedWineId} onValueChange={setSelectedWineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um vinho" />
                </SelectTrigger>
                <SelectContent>
                  {availableWines.length === 0 ? (
                    <SelectItem value="" disabled>
                      Nenhum vinho disponível
                    </SelectItem>
                  ) : (
                    availableWines.map((wine) => (
                      <SelectItem key={wine.id} value={wine.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{wine.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {wine.type && wine.country
                              ? `${wine.type} - ${wine.country}`
                              : wine.type || wine.country || "—"}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
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
            onClick={handleSubmit}
            disabled={loading || !selectedWineId || availableWines.length === 0}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adicionando...
              </>
            ) : (
              "Adicionar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
