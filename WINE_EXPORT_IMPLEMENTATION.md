# Funcionalidade de Exportação de Vinhos

## Análise do Schema de Wines

O schema de `wines` contém os seguintes campos relevantes para a funcionalidade de exportação:

```typescript
- id: Identificador único (UUID)
- name: Nome do vinho (obrigatório)
- country: País de origem
- type: Tipo do vinho
- inStock: Quantidade em estoque (obrigatório, padrão: 0)
- minStock: Estoque mínimo (obrigatório, padrão: 0)
- size: Tamanho/volume
- discontinued: Se o vinho foi descontinuado (padrão: false)
- externalId: ID externo (obrigatório, único)
- createdAt: Data de criação
- updatedAt: Data da última atualização
```

### Campos Chave para Controle de Estoque:
- **inStock**: Quantidade atual em estoque
- **minStock**: Nível mínimo de estoque desejado
- **discontinued**: Indica se o produto foi descontinuado

## Implementação

### 1. Arquivo de Ações: `wines-export.ts`

Localização: `src/app/actions/wines-export.ts`

**Funcionalidades implementadas:**

#### `exportLowStockWines()`
Exporta vinhos com estoque baixo (não zerados) que atendem aos critérios:
- `inStock > 0` (estoque maior que zero)
- `inStock < minStock` (estoque atual menor que o mínimo)

**Campos exportados:**
- Nome
- País
- Tipo
- Tamanho
- Estoque Atual
- Estoque Mínimo
- Descontinuado (Sim/Não)
- Última Atualização

#### `exportZeroStockWines()`
Exporta vinhos com estoque zerado que atendem ao critério:
- `inStock = 0` (estoque zerado)

**Campos exportados:**
- Nome
- País
- Tipo
- Tamanho
- Estoque Mínimo
- Descontinuado (Sim/Não)
- Última Atualização

**Características técnicas:**
- Ordenação por data de atualização (mais recentes primeiro)
- Formatação de datas para padrão brasileiro (dd/MM/yyyy)
- Valores nulos exibidos como "N/A"
- Largura de colunas ajustada automaticamente
- Nome do arquivo inclui data de exportação (formato: yyyy-MM-dd)
- Retorno em base64 para download no cliente

### 2. Componente de UI: `wine-export-buttons.tsx`

Localização: `src/app/(app)/wines/wine-export-buttons.tsx`

**Características:**
- Dropdown menu com duas opções de exportação
- Estados de loading individuais para cada operação
- Feedback visual com ícones e descrições
- Toast notifications para sucesso/erro
- Conversão automática de base64 para blob e download
- Design responsivo usando Radix UI

### 3. Integração na Página de Vinhos

Localização: `src/app/(app)/wines/page.tsx`

**Alterações:**
- Importação do componente `WineExportButtons`
- Adição do botão de exportação no header ao lado do botão "Atualizar Cache"
- Layout flexível para acomodar múltiplos botões

## Dependências Adicionadas

```json
{
  "xlsx": "^0.18.5"
}
```

A biblioteca `xlsx` (SheetJS) foi escolhida por ser:
- Amplamente utilizada e mantida
- Compatível com Node.js e navegadores
- Suporte completo a formatos Excel modernos (.xlsx)
- Fácil de usar para criação de planilhas

## Como Usar

1. Acesse a página de Vinhos (`/wines`)
2. No canto superior direito, clique no botão "Exportar"
3. Selecione uma das opções:
   - **Estoque Baixo**: Exporta vinhos com estoque positivo mas abaixo do mínimo
   - **Estoque Zerado**: Exporta vinhos sem estoque disponível
4. O arquivo Excel será baixado automaticamente com o nome:
   - `vinhos-estoque-baixo_YYYY-MM-DD.xlsx`
   - `vinhos-estoque-zerado_YYYY-MM-DD.xlsx`

## Validações e Tratamento de Erros

- Verificação se existem vinhos para exportar
- Mensagens de erro amigáveis para o usuário
- Logs de erro no console para debugging
- Tratamento de exceções em todos os níveis
- Estados de loading para prevenir múltiplos cliques

## Possíveis Melhorias Futuras

1. **Filtros personalizados**: Permitir exportar com filtros específicos (país, tipo, etc.)
2. **Formatos adicionais**: Suporte para CSV, PDF
3. **Agendamento**: Exportação automática periódica por email
4. **Histórico**: Rastreamento de exportações realizadas
5. **Gráficos**: Incluir visualizações na planilha
6. **Múltiplas abas**: Combinar ambos os relatórios em um único arquivo
7. **Personalização**: Permitir usuário escolher quais colunas exportar
