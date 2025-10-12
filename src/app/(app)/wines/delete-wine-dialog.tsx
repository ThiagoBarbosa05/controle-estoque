"use client";
import { Wine } from "@/app/actions/wines";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useWineActions } from "@/hooks/use-wine-actions";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";

interface DeleteWineDialogProps {
  wine: Wine;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function DeleteWineDialog({
  wine,
  onOpenChange,
  trigger,
}: DeleteWineDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>("");

  const { handleDeleteWine, isPending } = useWineActions();

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    onOpenChange?.(newOpen);

    if (!newOpen) {
      setError("");
    }
  };

  const handleDelete = async () => {
    setError("");

    const result = await handleDeleteWine(wine.id);

    if (result.success) {
      handleOpenChange(false);
    } else {
      setError(result.error || "Erro ao excluir vinho");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Vinho
          </DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o vinho <strong>{wine.name}</strong>?
            Esta ação irá marcá-lo como descontinuado.
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
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
