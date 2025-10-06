"use client";

import { Customer } from "@/app/actions/customers";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCustomerActions } from "@/hooks/use-customer-actions";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DeleteCustomerDialogProps {
  customer: Customer;
  children: React.ReactNode;
  onSuccess?: () => void;
}

export function DeleteCustomerDialog({
  customer,
  children,
  onSuccess,
}: DeleteCustomerDialogProps) {
  const [open, setOpen] = useState(false);
  const { handleDeleteCustomer, isPending, error } = useCustomerActions();

  const handleConfirm = () => {
    handleDeleteCustomer(customer.id);

    if (!error) {
      setOpen(false);
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir o cliente{" "}
            <strong>{customer.name}</strong>? Esta ação não pode ser desfeita.
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
