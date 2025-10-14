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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { useCustomerWinesActions } from "@/hooks/use-customer-wines-actions";

interface ClearCustomerListDialogProps {
  customerId: string;
  customerName: string;
  trigger?: React.ReactNode;
}

export function ClearCustomerListDialog({
  customerId,
  customerName,
  trigger,
}: ClearCustomerListDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleClearCustomerList, isPending } = useCustomerWinesActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);

    if (!newOpen) {
      setError("");
    }
  };

  const handleClear = async () => {
    setError("");

    const result = await handleClearCustomerList(customerId);

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao limpar lista do cliente");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-red-600">
            <X className="h-4 w-4 mr-1" />
            Limpar Lista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Limpar Lista Completa
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja remover TODOS os vinhos da lista de{" "}
            <strong>{customerName}</strong>? Esta ação não pode ser desfeita.
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
            onClick={handleClear}
            disabled={isPending}
          >
            {isPending ? "Limpando..." : "Limpar Lista"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
