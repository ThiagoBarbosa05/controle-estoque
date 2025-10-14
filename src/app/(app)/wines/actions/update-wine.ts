"use server";

import {
  revalidateWinesCache,
  revalidateWineStatsCache,
} from "@/app/(app)/wines/actions/wines-cache";
import { db } from "@/db";
import { wines } from "@/db/schema";
import { ActionsResponse, type FormState } from "@/lib/form-state";
import z from "zod";
import { createWineSchema } from "./schemas/schema";
import { and, eq, ilike } from "drizzle-orm";

export async function updateWine(
  wineId: string,
  _formState: FormState,
  formData: FormData
) {
  try {
    console.log("Parsed Data:", formData.get("discontinued"));

    const parsedData = createWineSchema.parse(Object.fromEntries(formData));

    const existingWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(eq(wines.id, wineId))
      .limit(1);

    if (existingWine.length === 0) {
      return ActionsResponse.onError({
        status: "ERROR",
        err: new Error("Vinho não encontrado."),
        payload: formData,
      });
    }

    const duplicateWine = await db
      .select({ id: wines.id })
      .from(wines)
      .where(
        and(
          ilike(wines.name, parsedData.name),
          ilike(wines.country, parsedData.country),
          eq(wines.type, parsedData.type),
          eq(wines.size, parsedData.size)
        )
      )
      .limit(1);

    if (duplicateWine.length > 0 && duplicateWine[0].id !== wineId) {
      return ActionsResponse.onError({
        status: "ERROR",
        err: new Error(
          "Já existe outro vinho com este nome, país, tipo e tamanho"
        ),
        payload: formData,
      });
    }

    // Atualizar vinho
    const [updatedWine] = await db
      .update(wines)
      .set({
        name: parsedData.name,
        country: parsedData.country.toUpperCase(),
        type: parsedData.type.toUpperCase(),
        size: parsedData.size,
        inStock: parsedData.inStock,
        minStock: parsedData.minStock,
        discontinued: parsedData.discontinued,
      })
      .where(eq(wines.id, wineId))
      .returning();

    await revalidateWinesCache();
    await revalidateWineStatsCache();

    return ActionsResponse.onSuccess({
      status: "SUCCESS",
      message: `Vinho ${updatedWine.name} atualizado com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao atualizar vinho:", error);
    if (error instanceof z.ZodError) {
      return ActionsResponse.onError({
        status: "VALIDATION_ERROR",
        err: error,
        payload: formData,
      });
    }
    return ActionsResponse.onError({
      status: "ERROR",
      err: error instanceof Error ? error : new Error("Erro desconhecido"),
      payload: formData,
    });
  }
}
