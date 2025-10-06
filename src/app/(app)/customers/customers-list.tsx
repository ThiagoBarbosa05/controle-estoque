import { getCustomers } from "@/app/actions/customers";
import type { SearchParams } from "./page";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CustomersPagination } from "@/components/customers/customers-pagination";
import { unstable_cache } from "next/cache";
import { AddCustomerButton } from "./add-customer-Button";
import { EditCustomerButton } from "./edit-customer-button";
import { DeleteCustomerButton } from "./delete-customer-button";

export async function CustomersList({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page) || 1;
  const limit = Number(searchParams.limit) || 10;
  const search = searchParams.search || "";
  const sortBy = searchParams.sortBy || "createdAt";
  const sortOrder = searchParams.sortOrder || "desc";

  const result = await unstable_cache(
    async () =>
      await getCustomers({
        page,
        limit,
        search,
        sortBy: sortBy as "name" | "createdAt" | "updatedAt",
        sortOrder: sortOrder as "asc" | "desc",
      }),
    ["customers", page.toString(), limit.toString(), search, sortBy, sortOrder]
  )();

  if (!result.success) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">
            Erro ao carregar clientes: {result.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { customers, pagination } = result.data ?? {
    customers: [],
    pagination: null,
  };

  if (!customers || customers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Nenhum cliente encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Tente ajustar os filtros de busca"
                : "Comece adicionando seu primeiro cliente"}
            </p>
            <AddCustomerButton />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lista de clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clientes ({pagination?.total || 0})</CardTitle>
            <AddCustomerButton />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-medium">{customer.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Criado em{" "}
                        {new Date(customer.createdAt).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                      {customer.updatedAt !== customer.createdAt && (
                        <div>
                          Atualizado em{" "}
                          {new Date(customer.updatedAt).toLocaleDateString(
                            "pt-BR"
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    ID: {customer.id.slice(0, 8)}...
                  </Badge>
                  <EditCustomerButton customer={customer} />
                  <DeleteCustomerButton customer={customer} />
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <CustomersPagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                hasNext={pagination.hasNext}
                hasPrev={pagination.hasPrev}
                total={pagination.total}
                limit={pagination.limit}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
