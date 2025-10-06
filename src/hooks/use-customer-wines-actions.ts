"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  addWineToCustomer,
  removeWineFromCustomer,
  bulkAddWinesToCustomer,
  bulkRemoveWinesFromCustomer,
  transferWinesBetweenCustomers,
  clearCustomerWinesList,
  type AddWineToCustomerInput,
  type BulkAddWinesToCustomerInput,
  type TransferWinesInput,
} from "@/app/actions/customer-wines-list";
import { revalidateCustomerWinesCache } from "@/app/actions/customer-wines-cache";

export function useCustomerWinesActions() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAddWineToCustomer = async (data: AddWineToCustomerInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await addWineToCustomer(data);

          if (result.success) {
            await revalidateCustomerWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao adicionar vinho à lista:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleRemoveWineFromCustomer = async (data: AddWineToCustomerInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await removeWineFromCustomer(data);

          if (result.success) {
            await revalidateCustomerWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao remover vinho da lista:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleBulkAddWines = async (data: BulkAddWinesToCustomerInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await bulkAddWinesToCustomer(data);

          if (result.success) {
            await revalidateCustomerWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao adicionar vinhos em lote:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleBulkRemoveWines = async (data: BulkAddWinesToCustomerInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await bulkRemoveWinesFromCustomer(data);

          if (result.success) {
            await revalidateCustomerWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao remover vinhos em lote:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleTransferWines = async (data: TransferWinesInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await transferWinesBetweenCustomers(data);

          if (result.success) {
            await revalidateCustomerWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao transferir vinhos:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleClearCustomerList = async (customerId: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await clearCustomerWinesList(customerId);

          if (result.success) {
            await revalidateCustomerWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao limpar lista do cliente:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  return {
    isPending,
    handleAddWineToCustomer,
    handleRemoveWineFromCustomer,
    handleBulkAddWines,
    handleBulkRemoveWines,
    handleTransferWines,
    handleClearCustomerList,
  };
}

export function useCustomerWinesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilters = (filters: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams);

    // Atualizar parâmetros
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Resetar página ao filtrar
    if (Object.keys(filters).some((key) => key !== "page")) {
      params.delete("page");
    }

    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearFilters = () => {
    router.push("/wines-list", { scroll: false });
  };

  return {
    updateFilters,
    clearFilters,
    currentFilters: {
      search: searchParams.get("search") || "",
      customerId: searchParams.get("customerId") || "",
      wineType: searchParams.get("wineType") || "all",
      country: searchParams.get("country") || "all",
      discontinued: searchParams.get("discontinued") || "active",
      sortBy: searchParams.get("sortBy") || "addedAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
    },
  };
}
