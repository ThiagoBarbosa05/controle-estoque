"use client";

import { useState } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { useCustomerActions } from "@/hooks/use-customer-actions";
import type { Customer } from "@/app/actions/customers";

interface CustomerFormDialogProps {
  customer?: Customer;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function CustomerFormDialog({
  customer,
  trigger,
  onSuccess,
}: CustomerFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(customer?.name || "");
  const { handleCreateCustomer, handleUpdateCustomer, isPending, error } =
    useCustomerActions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    if (customer) {
      handleUpdateCustomer({ id: customer.id, name: name.trim() });
    } else {
      handleCreateCustomer({ name: name.trim() });
    }

    // Fechar modal após sucesso
    if (!error) {
      setOpen(false);
      setName("");
      onSuccess?.();
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName(customer?.name || "");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {customer ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cliente</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do cliente..."
              required
              disabled={isPending}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !name.trim()}>
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

interface DeleteCustomerDialogProps {
  customer: Customer;
  trigger: React.ReactNode;
  onSuccess?: () => void;
}

export function DeleteCustomerDialog({
  customer,
  trigger,
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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

// Botões de ação para facilitar o uso
export function AddCustomerButton({ className }: { className?: string }) {
  return (
    <CustomerFormDialog
      trigger={
        <Button className={className}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Cliente
        </Button>
      }
    />
  );
}

export function EditCustomerButton({ customer }: { customer: Customer }) {
  return (
    <CustomerFormDialog
      customer={customer}
      trigger={
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      }
    />
  );
}

export function DeleteCustomerButton({ customer }: { customer: Customer }) {
  return (
    <DeleteCustomerDialog
      customer={customer}
      trigger={
        <Button
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      }
    />
  );
}
