"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { ActionsResponse, FormState } from "@/lib/form-state";
import { ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createCustomerSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Nome do cliente deve ter no mínimo 2 caracteres" })
    .trim(),
});

export async function createCustomer(formState: FormState, formData: FormData) {
  try {
    const parsedData = createCustomerSchema.parse(Object.fromEntries(formData));

    const [existingCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(ilike(customers.name, parsedData.name))
      .limit(1);

    if (existingCustomer) {
      return ActionsResponse.onError({
        status: "ERROR",
        err: new Error("Já existe um cliente com esse nome."),
        payload: formData,
      });
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({
        name: parsedData.name,
      })
      .returning();

    revalidatePath("/customers");
    return ActionsResponse.onSuccess({
      status: "SUCCESS",
      message: `Cliente ${newCustomer.name} criado com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
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
