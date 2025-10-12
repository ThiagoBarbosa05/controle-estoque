import { Wine } from "@/app/actions/wines";
import { Button } from "@/components/ui/button";
import { WineFormDialog } from "@/app/(app)/wines/wine-dialogs";
import { Edit } from "lucide-react";

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
