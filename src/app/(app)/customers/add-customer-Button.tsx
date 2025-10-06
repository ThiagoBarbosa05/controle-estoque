import { Button } from "@/components/ui/button";
import { CustomerFormDialog } from "./customer-form-dialogs";
import { Plus } from "lucide-react";

// Botões de ação para facilitar o uso
export function AddCustomerButton({ className }: { className?: string }) {
  return (
    <CustomerFormDialog>
      <Button className={className}>
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline-block"> Adicionar Cliente</span>
      </Button>
    </CustomerFormDialog>
  );
}
