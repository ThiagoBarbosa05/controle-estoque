"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/app/actions/customers";
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
} from "@/app/actions/customers";

export function useCustomerActions() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const router = useRouter();

  const handleCreateCustomer = (data: CreateCustomerInput) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await createCustomer(data);
        if (result.success) {
          setSuccess(true);
          router.refresh();
        } else {
          setError(result.error || "Erro ao criar cliente");
        }
      } catch {
        setError("Erro inesperado ao criar cliente");
      }
    });
  };

  const handleUpdateCustomer = (data: UpdateCustomerInput) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await updateCustomer(data);
        if (result.success) {
          setSuccess(true);
          router.refresh();
        } else {
          setError(result.error || "Erro ao atualizar cliente");
        }
      } catch {
        setError("Erro inesperado ao atualizar cliente");
      }
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      try {
        const result = await deleteCustomer({ id });
        if (result.success) {
          setSuccess(true);
          router.refresh();
        } else {
          setError(result.error || "Erro ao excluir cliente");
        }
      } catch {
        setError("Erro inesperado ao excluir cliente");
      }
    });
  };

  return {
    isPending,
    error,
    success,
    setError,
    handleCreateCustomer,
    handleUpdateCustomer,
    handleDeleteCustomer,
  };
}

export function useCustomerFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateSearchParams = (updates: Record<string, string | null>) => {
    const current = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });

    // Reset page when changing filters
    if ("search" in updates || "sortBy" in updates || "sortOrder" in updates) {
      current.delete("page");
    }

    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`/customers${query}`);
  };

  const currentSearch = searchParams.get("search") || "";
  const currentPage = Number(searchParams.get("page")) || 1;
  const currentSortBy = searchParams.get("sortBy") || "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  return {
    currentSearch,
    currentPage,
    currentSortBy,
    currentSortOrder,
    updateSearchParams,
  };
}
