"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  total: number;
  limit: number;
}

export function CustomersPagination({
  currentPage,
  totalPages,
  hasNext,
  hasPrev,
  total,
  limit,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/customers?${params.toString()}`);
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="flex items-center justify-between px-2">
      <div className="flex-1 text-sm text-muted-foreground">
        Mostrando {startItem} até {endItem} de {total} clientes
      </div>

      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Página {currentPage} de {totalPages}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => navigateToPage(1)}
            disabled={!hasPrev}
          >
            <span className="sr-only">Ir para primeira página</span>
            <ChevronsLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => navigateToPage(currentPage - 1)}
            disabled={!hasPrev}
          >
            <span className="sr-only">Ir para página anterior</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => navigateToPage(currentPage + 1)}
            disabled={!hasNext}
          >
            <span className="sr-only">Ir para próxima página</span>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => navigateToPage(totalPages)}
            disabled={!hasNext}
          >
            <span className="sr-only">Ir para última página</span>
            <ChevronsRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
