"use client";

import { useState, useTransition, useCallback } from "react";
import {
  createUser,
  updateUser,
  deleteUser,
  bulkDeleteUsers,
  bulkUpdateUsers,
  verifyUserEmail,
  type CreateUserInput,
  type UpdateUserInput,
  type BulkDeleteUsersInput,
  type BulkUpdateUsersInput,
  type User,
} from "@/app/actions/users";

// Hook principal para gerenciar ações de usuários
export function useUserActions() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const handleAction = useCallback(
    async <T>(
      action: () => Promise<{ success: boolean; data?: T; error?: string }>,
      successMessage: string,
      onSuccess?: (data?: T) => void
    ) => {
      startTransition(async () => {
        try {
          clearMessages();
          const result = await action();

          if (result.success) {
            setSuccess(successMessage);
            onSuccess?.(result.data);
          } else {
            setError(result.error || "Ocorreu um erro");
          }
        } catch (err) {
          setError("Erro interno do servidor");
          console.error("Erro na ação:", err);
        }
      });
    },
    [clearMessages]
  );

  const actions = {
    createUser: (input: CreateUserInput, onSuccess?: (user?: User) => void) => {
      handleAction(
        () => createUser(input),
        "Usuário criado com sucesso!",
        onSuccess
      );
    },

    updateUser: (input: UpdateUserInput, onSuccess?: (user?: User) => void) => {
      handleAction(
        () => updateUser(input),
        "Usuário atualizado com sucesso!",
        onSuccess
      );
    },

    deleteUser: (userId: string, onSuccess?: () => void) => {
      handleAction(
        () => deleteUser(userId),
        "Usuário deletado com sucesso!",
        onSuccess
      );
    },

    bulkDeleteUsers: (input: BulkDeleteUsersInput, onSuccess?: () => void) => {
      handleAction(
        () => bulkDeleteUsers(input),
        `${input.userIds.length} usuário(s) deletado(s) com sucesso!`,
        onSuccess
      );
    },

    bulkUpdateUsers: (input: BulkUpdateUsersInput, onSuccess?: () => void) => {
      handleAction(
        () => bulkUpdateUsers(input),
        `${input.userIds.length} usuário(s) atualizado(s) com sucesso!`,
        onSuccess
      );
    },

    verifyEmail: (userId: string, onSuccess?: (user?: User) => void) => {
      handleAction(
        () => verifyUserEmail(userId),
        "Email verificado com sucesso!",
        onSuccess
      );
    },
  };

  return {
    isPending,
    error,
    success,
    actions,
    clearMessages,
  };
}

// Hook para gerenciar seleção de usuários
export function useUserSelection() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const toggleUser = useCallback((userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  const selectAll = useCallback((userIds: string[]) => {
    setSelectedUsers(userIds);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedUsers([]);
  }, []);

  const hasSelection = useCallback(
    () => selectedUsers.length > 0,
    [selectedUsers.length]
  );

  const getSelectionCount = useCallback(
    () => selectedUsers.length,
    [selectedUsers.length]
  );

  const isSelected = useCallback(
    (userId: string) => selectedUsers.includes(userId),
    [selectedUsers]
  );

  return {
    selectedUsers,
    toggleUser,
    selectAll,
    clearSelection,
    hasSelection,
    getSelectionCount,
    isSelected,
  };
}

// Hook para gerenciar filtros de usuários
export function useUserFilters() {
  const [filters, setFilters] = useState({
    search: "",
    emailVerified: "all" as "all" | "verified" | "unverified",
    sortBy: "createdAt" as "name" | "email" | "createdAt" | "updatedAt",
    sortOrder: "desc" as "asc" | "desc",
  });

  const updateFilter = useCallback(
    (key: keyof typeof filters, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      search: "",
      emailVerified: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
    });
  }, []);

  const hasActiveFilters = useCallback(() => {
    return filters.search !== "" || filters.emailVerified !== "all";
  }, [filters.search, filters.emailVerified]);

  return {
    filters,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}

// Utilitários para usuários
export const userUtils = {
  // Formatar nome de exibição do usuário
  formatUserDisplay: (user: { name: string; email: string }) => {
    return `${user.name} (${user.email})`;
  },

  // Agrupar usuários por status de verificação
  groupUsersByVerification: <T extends { emailVerified: boolean }>(
    users: T[]
  ) => {
    return users.reduce(
      (acc, user) => {
        if (user.emailVerified) {
          acc.verified.push(user);
        } else {
          acc.unverified.push(user);
        }
        return acc;
      },
      { verified: [] as T[], unverified: [] as T[] }
    );
  },

  // Contar usuários por status
  countUsersByStatus: (users: { emailVerified: boolean }[]) => {
    const counts = users.reduce(
      (acc, user) => {
        if (user.emailVerified) {
          acc.verified++;
        } else {
          acc.unverified++;
        }
        acc.total++;
        return acc;
      },
      { total: 0, verified: 0, unverified: 0 }
    );

    return {
      ...counts,
      verificationRate:
        counts.total > 0 ? (counts.verified / counts.total) * 100 : 0,
    };
  },

  // Filtrar usuários por termo de busca
  filterUsersBySearch: <T extends { name: string; email: string }>(
    users: T[],
    searchTerm: string
  ) => {
    if (!searchTerm.trim()) return users;

    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  },

  // Ordenar usuários
  sortUsers: <
    T extends { name: string; email: string; createdAt: Date; updatedAt: Date }
  >(
    users: T[],
    sortBy: "name" | "email" | "createdAt" | "updatedAt",
    sortOrder: "asc" | "desc"
  ) => {
    return [...users].sort((a, b) => {
      let valueA: string | Date;
      let valueB: string | Date;

      switch (sortBy) {
        case "name":
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case "email":
          valueA = a.email.toLowerCase();
          valueB = b.email.toLowerCase();
          break;
        case "updatedAt":
          valueA = a.updatedAt;
          valueB = b.updatedAt;
          break;
        default:
          valueA = a.createdAt;
          valueB = b.createdAt;
          break;
      }

      if (valueA < valueB) return sortOrder === "asc" ? -1 : 1;
      if (valueA > valueB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  },

  // Validar dados do usuário
  validateUserData: (user: Partial<CreateUserInput | UpdateUserInput>) => {
    const errors: Record<string, string> = {};

    if ("name" in user && (!user.name || user.name.trim().length === 0)) {
      errors.name = "Nome é obrigatório";
    }

    if ("name" in user && user.name && user.name.length > 255) {
      errors.name = "Nome deve ter no máximo 255 caracteres";
    }

    if ("email" in user && user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        errors.email = "Email inválido";
      }
    }

    if ("email" in user && user.email && user.email.length > 255) {
      errors.email = "Email deve ter no máximo 255 caracteres";
    }

    if ("image" in user && user.image) {
      try {
        new URL(user.image);
      } catch {
        errors.image = "URL da imagem inválida";
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  // Formatar data de criação
  formatCreatedAt: (date: Date) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  },

  // Calcular tempo desde criação
  getTimeSinceCreated: (date: Date) => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Hoje";
    if (diffInDays === 1) return "Ontem";
    if (diffInDays < 7) return `${diffInDays} dias atrás`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
    return `${Math.floor(diffInDays / 365)} anos atrás`;
  },

  // Gerar avatar de fallback
  getAvatarFallback: (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  },
};
