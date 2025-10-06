"use server";

import { db } from "@/db";
import { customers } from "@/db/schema";
import { ActionsResponse, FormState } from "@/lib/form-state";
import { eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateCustomerSchema = z.object({
  name: z
    .string()
    .min(2, { error: "Nome do cliente deve ter no mínimo 2 caracteres" })
    .trim(),
});

export async function updateCustomer(
  customerId: string,
  formState: FormState,
  formData: FormData
) {
  try {
    const parsedData = updateCustomerSchema.parse(Object.fromEntries(formData));

    const [existingCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(ilike(customers.id, customerId))
      .limit(1);

    if (!existingCustomer) {
      return ActionsResponse.onError({
        status: "ERROR",
        err: new Error("Cliente não encontrado."),
        payload: formData,
      });
    }

    const [duplicateCustomer] = await db
      .select({ id: customers.id })
      .from(customers)
      .where(ilike(customers.name, parsedData.name))
      .limit(1);

    if (duplicateCustomer && duplicateCustomer.id !== customerId) {
      return ActionsResponse.onError({
        status: "ERROR",
        err: new Error("Já existe um cliente com esse nome."),
        payload: formData,
      });
    }

    // Atualizar customer
    const [updatedCustomer] = await db
      .update(customers)
      .set({ name: parsedData.name })
      .where(eq(customers.id, customerId))
      .returning();

    revalidatePath("/customers");
    return ActionsResponse.onSuccess({
      status: "SUCCESS",
      message: `Cliente ${updatedCustomer.name} atualizado com sucesso!`,
    });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
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
