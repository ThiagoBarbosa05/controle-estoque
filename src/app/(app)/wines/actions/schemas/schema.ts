import z from "zod";

export const wineTypeEnum = z.enum(
  ["all", "TINTO", "BRANCO", "ROSE", "ESPUMANTE", "FORTIFICADO", "SOBREMESA"],
  { error: "Tipo inválido" }
);

export const wineSizeEnum = z.enum(
  ["all", "187ML", "375ML", "750ML", "1L", "1.5L", "3L", "6L"],
  { error: "Tamanho inválido" }
);

export const wineCountryEnum = z.enum(
  [
    "all",
    "CHILE",
    "ARGENTINA",
    "ITALIA",
    "FRANÇA",
    "ALEMANHA",
    "URUGUAI",
    "PORTUGAL",
    "ESPANHA",
    "BRASIL",
    "ESTADOS UNIDOS",
    "NOVA ZELÂNDIA",
    "OUTROS",
  ],
  { error: "País inválido" }
);

export const createWineSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres")
    .trim()
    .transform((val) => val.replace(/\s+/g, " ")),
  country: wineCountryEnum,
  type: wineTypeEnum,
  size: wineSizeEnum,
  inStock: z
    .string()
    .regex(/^\d+$/, "Estoque deve ser um número")
    .transform((val) => val.trim())
    .refine((val) => parseInt(val) >= 0, "Estoque não pode ser negativo"),
  discontinued: z.coerce.boolean().default(false),
});
