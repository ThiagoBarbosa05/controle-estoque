"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createWine,
  updateWine,
  deleteWine,
  updateWineStock,
  type CreateWineInput,
  type UpdateWineInput,
} from "@/app/actions/wines";
import { revalidateWinesCache } from "@/app/(app)/wines/actions/wines-cache";
// import { toggleWineDiscontinued } from "@/app/actions/wines-backup";

export function useWineActions() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleCreateWine = async (data: CreateWineInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await createWine(data);

          if (result.success) {
            await revalidateWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao criar vinho:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleUpdateWine = async (data: UpdateWineInput) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await updateWine(data);

          if (result.success) {
            await revalidateWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao atualizar vinho:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleUpdateStock = async (id: string, inStock: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await updateWineStock({ id, inStock });

          if (result.success) {
            await revalidateWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao atualizar estoque:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleToggleDiscontinued = async (
    id: string,
    discontinued: boolean
  ) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          // const result = await toggleWineDiscontinued(id, discontinued);
          const result = { success: false, error: "Not implemented" };

          if (result.success) {
            await revalidateWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao alterar status:", error);
          resolve({
            success: false,
            error: "Erro interno do servidor",
          });
        }
      });
    });
  };

  const handleDeleteWine = async (id: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      startTransition(async () => {
        try {
          const result = await deleteWine({ id });

          if (result.success) {
            await revalidateWinesCache();
            router.refresh();
          }

          resolve(result);
        } catch (error) {
          console.error("Erro ao deletar vinho:", error);
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
    handleCreateWine,
    handleUpdateWine,
    handleUpdateStock,
    handleToggleDiscontinued,
    handleDeleteWine,
  };
}

export function useWineFilters() {
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
    router.push("/wines", { scroll: false });
  };

  return {
    updateFilters,
    clearFilters,
    currentFilters: {
      search: searchParams.get("search") || "",
      country: searchParams.get("country") || "all",
      type: searchParams.get("type") || "all",
      size: searchParams.get("size") || "all",
      inStock: searchParams.get("inStock") || "all",
      discontinued: searchParams.get("discontinued") || "active",
      sortBy: searchParams.get("sortBy") || "createdAt",
      sortOrder: searchParams.get("sortOrder") || "desc",
      page: parseInt(searchParams.get("page") || "1"),
    },
  };
}
