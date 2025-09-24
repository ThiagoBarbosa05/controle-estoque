// Constantes e tipos úteis para wines
export const WINE_TYPES = [
  "Tinto",
  "Branco",
  "Rosé",
  "Espumante",
  "Fortificado",
  "Sobremesa",
] as const;

export const WINE_SIZES = [
  "187ml", // Piccolo/Split
  "375ml", // Half bottle
  "750ml", // Standard
  "1L", // Liter
  "1.5L", // Magnum
  "3L", // Double Magnum
  "6L", // Imperial
] as const;

export const STOCK_LEVELS = {
  OUT_OF_STOCK: "0",
  LOW_STOCK_THRESHOLD: 5,
  CRITICAL_STOCK_THRESHOLD: 2,
} as const;

export const WINE_FILTERS = {
  STOCK: {
    ALL: "all",
    AVAILABLE: "available",
    OUT_OF_STOCK: "out-of-stock",
  },
  STATUS: {
    ALL: "all",
    ACTIVE: "active",
    DISCONTINUED: "discontinued",
  },
} as const;

export const SORT_OPTIONS = {
  NAME: "name",
  COUNTRY: "country",
  TYPE: "type",
  STOCK: "inStock",
  CREATED: "createdAt",
  UPDATED: "updatedAt",
} as const;

// Mapeamento de tamanhos para display
export const SIZE_DISPLAY_MAP: Record<string, string> = {
  "187ml": "187ml (Piccolo)",
  "375ml": "375ml (Meia Garrafa)",
  "750ml": "750ml (Padrão)",
  "1L": "1L (Litro)",
  "1.5L": "1.5L (Magnum)",
  "3L": "3L (Double Magnum)",
  "6L": "6L (Imperial)",
};

// Helper functions
export function getWineTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Tinto: "#8B0000", // Dark Red
    Branco: "#FFF8DC", // Cornsilk
    Rosé: "#FFB6C1", // Light Pink
    Espumante: "#F0E68C", // Khaki
    Fortificado: "#CD853F", // Peru
    Sobremesa: "#DDA0DD", // Plum
  };
  return colors[type] || "#808080"; // Gray default
}

export function getStockStatus(inStock: string): {
  status: "out-of-stock" | "low-stock" | "in-stock";
  label: string;
  color: string;
} {
  const stock = parseInt(inStock);

  if (stock === 0) {
    return {
      status: "out-of-stock",
      label: "Sem Estoque",
      color: "#DC2626", // Red
    };
  }

  if (stock <= STOCK_LEVELS.CRITICAL_STOCK_THRESHOLD) {
    return {
      status: "low-stock",
      label: "Estoque Crítico",
      color: "#EA580C", // Orange
    };
  }

  if (stock <= STOCK_LEVELS.LOW_STOCK_THRESHOLD) {
    return {
      status: "low-stock",
      label: "Estoque Baixo",
      color: "#D97706", // Amber
    };
  }

  return {
    status: "in-stock",
    label: "Em Estoque",
    color: "#059669", // Green
  };
}

export function formatWineDisplayName(wine: {
  name: string;
  country: string;
  type: string;
  size: string;
}): string {
  return `${wine.name} - ${wine.country} (${wine.type} ${wine.size})`;
}

export function isValidWineType(
  type: string
): type is (typeof WINE_TYPES)[number] {
  return (WINE_TYPES as readonly string[]).includes(type);
}

export function isValidWineSize(
  size: string
): size is (typeof WINE_SIZES)[number] {
  return (WINE_SIZES as readonly string[]).includes(size);
}
