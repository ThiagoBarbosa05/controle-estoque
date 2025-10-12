import { Wine } from "@/app/actions/wines";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { DeleteWineDialog } from "./delete-wine-dialog";

export function DeleteWineButton({ wine }: { wine: Wine }) {
  return (
    <DeleteWineDialog
      wine={wine}
      trigger={
        <Button
          variant="outline"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
        </Button>
      }
    />
  );
}
