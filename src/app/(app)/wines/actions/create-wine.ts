"use server";

import {
  revalidateWinesCache,
  revalidateWineStatsCache,
} from "@/app/(app)/wines/actions/wines-cache";
import { db } from "@/db";
import { wines } from "@/db/schema";
import { ActionsResponse, FormState } from "@/lib/form-state";
import { and, eq, ilike } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import z from "zod";
import { createWineSchema } from "./schemas/schema";
import { nanoid } from "nanoid";

export async function createWine(formState: FormState, formData: FormData) {
  try {
    const parsedData = createWineSchema.parse(Object.fromEntries(formData));

    const existingWine = await db
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

    if (existingWine.length > 0) {
      return ActionsResponse.onError({
        status: "ERROR",
        err: new Error(
          "Já existe um vinho com esse nome, país, tipo e tamanho."
        ),
        payload: formData,
      });
    }

    // Inserir novo wine
    const [newWine] = await db
      .insert(wines)
      .values({
        ...parsedData,
        type: parsedData.type.toUpperCase(),
        country: parsedData.country.toUpperCase(),
        externalId: `unSync-${nanoid()}`,
      })
      .returning();

    await revalidateWinesCache();
    await revalidateWineStatsCache();

    return ActionsResponse.onSuccess({
      status: "SUCCESS",
      message: `Vinho ${newWine.name} criado com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao criar vinho:", error);
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
