"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

/**
 * Revalida o cache de todas as páginas do dashboard
 */
export async function revalidateDashboard() {
  try {
    // Revalidar todas as páginas principais
    revalidatePath("/dashboard");
    revalidatePath("/customers");
    revalidatePath("/wines");
    revalidatePath("/users");
    revalidatePath("/customer-wines");

    // Revalidar layout principal
    revalidatePath("/(app)");
  } catch (error) {
    console.error("Erro ao revalidar cache:", error);
  }
}

/**
 * Revalida o cache e redireciona para o dashboard
 */
export async function revalidateAndRedirect() {
  await revalidateDashboard();
  redirect("/dashboard");
}
