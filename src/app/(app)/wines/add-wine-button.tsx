import { Button } from "@/components/ui/button";
import { WineFormDialog } from "@/app/(app)/wines/wine-dialogs";
import { Plus } from "lucide-react";

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
