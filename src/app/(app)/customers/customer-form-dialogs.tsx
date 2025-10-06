"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { Customer } from "@/app/actions/customers";
import { createCustomer } from "./actions/create-customer";
import { EMPTY_FORM_STATE } from "@/lib/form-state";
import { toast } from "sonner";
import { updateCustomer } from "./actions/update-customer";

interface CustomerFormDialogProps {
  customer?: Customer;
  children?: React.ReactNode;
}

export function CustomerFormDialog({
  customer,
  children,
}: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);
  // const [customerId, setCustomerId] = useState(customer?.id || "");
  // const { handleCreateCustomer, handleUpdateCustomer, isPending, error } =
  //   useCustomerActions();

  const [formState, formAction, isPending] = useActionState(
    customer ? updateCustomer.bind(null, customer.id) : createCustomer,
    EMPTY_FORM_STATE
  );

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   if (!name.trim()) {
  //     return;
  //   }

  //   if (customer) {
  //     handleUpdateCustomer({ id: customer.id, name: name.trim() });
  //   } else {
  //     handleCreateCustomer({ name: name.trim() });
  //   }

  //   // Fechar modal após sucesso
  //   if (!error) {
  //     setOpen(false);
  //     setName("");
  //     onSuccess?.();
  //   }
  // };

  const handleClose = () => {
    setOpen(false);
  };

  useEffect(() => {
    if (formState.status === "SUCCESS") {
      setOpen(false);
      toast.success(formState.message);
    } else if (formState.status === "ERROR") {
      toast.error(formState.message || "Erro ao salvar cliente");
    }
  }, [formState]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente</Label>
            <Input
              id="name"
              type="text"
              name="name"
              placeholder="Digite o nome do cliente..."
              defaultValue={
                formState.payload?.get("name")?.toString() ||
                customer?.name ||
                ""
              }
              disabled={isPending}
              autoFocus
            />
            {formState.fieldErrors && (
              <p className="text-sm text-red-400">
                {formState.fieldErrors.name?.[0]}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {customer ? "Salvando..." : "Criando..."}
                </>
              ) : customer ? (
                "Salvar"
              ) : (
                "Criar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
