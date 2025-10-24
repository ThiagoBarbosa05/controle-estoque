# Customer Wines Module - Refactored

## Visão Geral

Este módulo foi completamente refatorado seguindo as melhores práticas do Next.js App Router, separando responsabilidades e otimizando performance.

## Nova Estrutura

### 📁 Types (`src/types/customer-wines.ts`)

- Definições TypeScript centralizadas
- Tipos para entidades, filtros, paginação e resultados de ações
- Compatibilidade com tipos de banco de dados do Drizzle

### 📁 Schemas (`src/lib/schemas/customer-wines.ts`)

- Validação Zod modularizada
- Schemas compostos para queries complexas
- Input types inferidos automaticamente

### 📁 Server Actions (`src/app/actions/customer-wines/`)

```
├── basic-operations.ts     # CRUD básico (add, remove, clear)
├── bulk-operations.ts      # Operações em lote (bulk add/remove, transfer)
├── stats.ts               # Estatísticas e métricas
└── index.ts               # Re-exports centralizados
```

### 📁 Data Fetching (`src/lib/data/customer-wines.ts`)

- Funções otimizadas com React cache()
- Queries performáticas com Drizzle ORM
- Tratamento de erros robusto

### 📁 Components (`src/components/customer-wines/`)

```
├── customer-wines-list.tsx           # RSC principal com Suspense
├── customer-wines-table.tsx          # Tabela interativa (Client)
├── customer-wines-filters-simple.tsx # Filtros baseados em URL
├── customer-wines-pagination.tsx     # Paginação com search params
├── customer-wines-loading.tsx        # Skeleton loading
├── customer-wines-stats.tsx          # Dashboard de estatísticas (RSC)
├── add-wine-to-customer.tsx          # Modal para adicionar (Client)
└── bulk-remove-wines.tsx             # Ações em lote (Client)
```

### 📁 Cache Configuration (`src/lib/cache/customer-wines.ts`)

- Tags de cache para revalidação targeted
- Configurações de duração otimizadas
- Utilitários para performance

## Padrões Implementados

### 🔄 React Server Components (RSC)

- **Server-first**: Busca de dados no servidor
- **Streaming**: Suspense boundaries para carregamento progressivo
- **Cache**: React cache() para deduplications

### 🎯 Client Components Minimais

- Apenas componentes interativos são "use client"
- State management localizado
- Server Actions para mutations

### 📊 URL-Based State Management

- Filtros e paginação via search params
- Estado persistente no URL
- Navegação sem JavaScript funciona

### ⚡ Performance Optimizations

- Cache strategies diferenciadas
- Parallel queries quando possível
- Revalidation targeted por operação

## Como Usar

### 1. Página Básica

```tsx
import { CustomerWinesList } from "@/components/customer-wines/customer-wines-list";

export default async function Page({ params, searchParams }) {
  return (
    <CustomerWinesList
      customerId={params.customerId}
      searchParams={searchParams}
    />
  );
}
```

### 2. Com Estatísticas

```tsx
import { Suspense } from "react";
import { CustomerWinesStats } from "@/components/customer-wines/customer-wines-stats";
import { Skeleton } from "@/components/ui/skeleton";

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <CustomerWinesStats />
    </Suspense>
  );
}
```

### 3. Server Actions

```tsx
import { addWineToCustomer } from "@/app/actions/customer-wines/basic-operations";

// Em um Server Action ou Route Handler
const result = await addWineToCustomer({
  customerId: "uuid",
  wineId: "uuid",
});

if (result.success) {
  // Sucesso
} else {
  // Erro: result.error
}
```

## Melhorias Implementadas

### ✅ Separação de Responsabilidades

- Lógica de negócio isolada
- Componentes focados em UI
- Validação centralizada

### ✅ Type Safety

- Types completos do TypeScript
- Validação runtime com Zod
- IntelliSense aprimorado

### ✅ Performance

- React cache() para deduplication
- Suspense para streaming
- Paginação eficiente

### ✅ UX Melhorada

- Loading states granulares
- Error boundaries
- Feedback visual consistente

### ✅ Manutenibilidade

- Código modular e testável
- Documentação inline
- Padrões consistentes

## Cache Strategy

### Server Components

- `cache()` do React para deduplication
- Revalidation com tags específicas
- TTL diferenciado por tipo de dado

### Search Params

- Estado da UI persiste no URL
- Bookmarkable e sharable
- SEO friendly

### Mutations

- Revalidation targeted após changes
- Loading states durante operações
- Rollback em caso de erro

## Migração do Código Antigo

O arquivo original `customer-wines-list.ts` foi substituído por:

1. **Types**: Movidos para `src/types/customer-wines.ts`
2. **Schemas**: Extraídos para `src/lib/schemas/customer-wines.ts`
3. **Server Actions**: Divididos em múltiplos arquivos focados
4. **Data Fetching**: Otimizado em `src/lib/data/customer-wines.ts`
5. **Components**: Criados do zero seguindo RSC patterns

Esta refatoração mantém toda a funcionalidade original while adding significant improvements in performance, maintainability, and user experience.
