import { notFound } from "next/navigation";
import { getCustomerWines } from "@/app/actions/customer-wines";
import { CustomerWinesClient } from "./components/customer-wines-client";

interface PageProps {
  params: Promise<{
    customerId: string;
  }>;
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    country?: string;
    type?: string;
    size?: string;
    discontinued?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function CustomerWinesPage({
  params,
  searchParams,
}: PageProps) {
  // Aguardar os parâmetros da URL
  const { customerId } = await params;
  const {
    page = "1",
    limit = "20",
    search,
    country,
    type,
    size,
    discontinued = "active",
    sortBy = "name",
    sortOrder = "asc",
  } = await searchParams;

  // Buscar dados dos vinhos do cliente no servidor
  const result = await getCustomerWines({
    customerId,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    search,
    country,
    type,
    size,
    discontinued: discontinued as "all" | "active" | "discontinued",
    sortBy: sortBy as "name" | "country" | "type" | "inStock",
    sortOrder: sortOrder as "asc" | "desc",
  });

  // Se cliente não existe, mostrar 404
  if (!result.success) {
    if (result.error === "Cliente não encontrado") {
      notFound();
    }
    // Para outros erros, pode mostrar uma página de erro personalizada
    throw new Error(result.error || "Erro interno do servidor");
  }

  // Passar dados para o componente cliente
  // Garantir que result.data está definido antes de passar
  if (!result.data) {
    throw new Error("Dados dos vinhos do cliente não encontrados.");
  }
  return (
    <CustomerWinesClient
      initialData={result.data}
      customerId={customerId}
      initialFilters={{
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        search: search || "",
        country: country || "all",
        type: type || "all",
        size: size || "all",
        discontinued: discontinued as "all" | "active" | "discontinued",
        sortBy: sortBy as "name" | "country" | "type" | "inStock",
        sortOrder: sortOrder as "asc" | "desc",
      }}
    />
  );
}

// Gerar metadata dinâmica para SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;

  // Buscar dados básicos do cliente para o título
  const result = await getCustomerWines({
    customerId,
    page: 1,
    limit: 1,
    discontinued: "active",
    sortBy: "name",
    sortOrder: "asc",
  });

  if (!result.success || !result.data) {
    return {
      title: "Cliente não encontrado - Controle de Estoque",
    };
  }

  return {
    title: `Lista de Vinhos - ${result.data.customer.name} - Controle de Estoque`,
    description: `Gerencie a lista de vinhos do cliente ${result.data.customer.name}. Total de ${result.data.stats.total} vinhos cadastrados.`,
  };
}
