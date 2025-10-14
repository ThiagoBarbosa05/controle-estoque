# Sistema de Webhooks Bling - Notas Fiscais

Este sistema implementa uma solução completa para receber, processar e armazenar dados de notas fiscais vindos dos webhooks do Bling.

## 📋 Funcionalidades

### ✅ Implementadas

- ✅ **Recepção de Webhooks**: Endpoint seguro para receber webhooks do Bling
- ✅ **Validação HMAC**: Autenticação das mensagens usando assinatura SHA-256
- ✅ **Processamento de Notas Fiscais**: Criação, atualização e exclusão
- ✅ **Sistema de Logs**: Registro completo de todas as operações (sucesso e erro)
- ✅ **Tratamento de Erros**: Captura e armazenamento detalhado de erros
- ✅ **Idempotência**: Prevenção de processamento duplicado
- ✅ **APIs de Consulta**: Endpoints para listar notas fiscais e logs
- ✅ **Estatísticas**: Relatórios de notas fiscais e performance dos webhooks
- ✅ **Paginação e Filtros**: Sistema completo de busca e filtros

## 🏗️ Estrutura do Banco de Dados

### Tabela `invoices`

Armazena as notas fiscais recebidas dos webhooks:

```sql
- id: UUID (Primary Key)
- bling_id: TEXT (ID único da nota fiscal no Bling)
- tipo: INTEGER (1=Entrada, 2=Saída)
- situacao: INTEGER (Situação da nota fiscal)
- numero: TEXT (Número da nota fiscal)
- data_emissao: TIMESTAMP (Data de emissão)
- data_operacao: TIMESTAMP (Data da operação)
- contato_id: TEXT (ID do contato no Bling)
- natureza_operacao_id: TEXT (ID da natureza da operação)
- loja_id: TEXT (ID da loja no Bling)
- valor_total: DECIMAL (Valor total da nota fiscal)
- raw_data: JSONB (Dados brutos do webhook para auditoria)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela `webhook_logs`

Registra todos os webhooks processados (sucesso e erro):

```sql
- id: UUID (Primary Key)
- event_id: TEXT (ID único do evento do webhook)
- event_type: TEXT (Tipo do evento: invoice.created, invoice.updated, etc.)
- resource_id: TEXT (ID do recurso processado)
- status: TEXT (success ou error)
- status_code: INTEGER (Código HTTP de resposta)
- error_message: TEXT (Mensagem de erro, se houver)
- error_stack: TEXT (Stack trace do erro, se houver)
- processed_at: TIMESTAMP (Data/hora do processamento)
- processing_time: INTEGER (Tempo de processamento em ms)
- request_headers: JSONB (Headers da requisição)
- request_body: JSONB (Body da requisição do webhook)
- response_body: JSONB (Resposta enviada de volta)
- ip_address: TEXT (IP de origem da requisição)
- user_agent: TEXT (User agent da requisição)
- signature: TEXT (Assinatura HMAC)
- signature_valid: BOOLEAN (Se a assinatura foi validada)
- retry_attempt: INTEGER (Número da tentativa)
- created_at: TIMESTAMP
```

## 🔧 Configuração

### 1. Variáveis de Ambiente

Adicione ao seu `.env.local`:

```env
BLING_CLIENT_SECRET=seu_client_secret_do_bling
```

### 2. Migration do Banco

Execute a migration para criar as tabelas:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### 3. Configuração no Bling

1. Acesse o [painel de desenvolvedores do Bling](https://developer.bling.com.br)
2. Vá para seu aplicativo → aba "Webhooks"
3. Configure a URL do webhook: `https://seu-dominio.com/api/webhooks/bling`
4. Selecione os recursos: "Nota fiscal" e "Nota fiscal de consumidor"
5. Marque as ações: `created`, `updated`, `deleted`

## 📡 Endpoints da API

### Webhook Receiver

```
POST /api/webhooks/bling
```

Endpoint principal para receber webhooks do Bling. Processa automaticamente:

- Notas fiscais eletrônicas
- Notas fiscais de consumidor
- Eventos de criação, atualização e exclusão

### Consulta de Notas Fiscais

```
GET /api/invoices?page=1&pageSize=20&tipo=1&situacao=1&startDate=2024-01-01&endDate=2024-12-31
```

**Parâmetros:**

- `page`: Número da página (padrão: 1)
- `pageSize`: Itens por página (padrão: 20, máx: 100)
- `tipo`: Tipo da nota fiscal (1=Entrada, 2=Saída)
- `situacao`: Situação da nota fiscal
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

**Resposta:**

```json
{
  "data": [
    {
      "id": "uuid",
      "blingId": "12345678",
      "tipo": 1,
      "situacao": 1,
      "numero": "123",
      "dataEmissao": "2024-09-27T11:24:56Z",
      "dataOperacao": "2024-09-27T11:00:00Z",
      "valorTotal": "123.45",
      "createdAt": "2024-09-27T11:25:00Z",
      "updatedAt": "2024-09-27T11:25:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Estatísticas de Notas Fiscais

```
GET /api/invoices/stats?startDate=2024-01-01&endDate=2024-12-31
```

**Resposta:**

```json
{
  "totalCount": 150,
  "totalValue": 75000.5,
  "byType": [
    {
      "tipo": 1,
      "count": 80,
      "valorTotal": 40000.25
    },
    {
      "tipo": 2,
      "count": 70,
      "valorTotal": 35000.25
    }
  ],
  "byStatus": [
    {
      "situacao": 1,
      "count": 140
    },
    {
      "situacao": 2,
      "count": 10
    }
  ]
}
```

### Logs de Webhooks

```
GET /api/webhooks/logs?page=1&pageSize=50&status=error&eventType=invoice.created
```

**Parâmetros:**

- `page`: Número da página (padrão: 1)
- `pageSize`: Itens por página (padrão: 50, máx: 100)
- `status`: Status do processamento (success ou error)
- `eventType`: Tipo do evento
- `startDate`: Data inicial (YYYY-MM-DD)
- `endDate`: Data final (YYYY-MM-DD)

### Health Check

```
GET /api/webhooks/bling
```

Verifica se o serviço está funcionando e configurado corretamente.

## 🔒 Segurança

### Validação HMAC

- Todas as mensagens do Bling são validadas usando HMAC SHA-256
- A assinatura é verificada usando o `Client Secret` do seu aplicativo
- Mensagens com assinatura inválida são rejeitadas

### Rate Limiting

- O sistema suporta tentativas de retry do Bling (até 3 dias)
- Timeout configurado para 5 segundos conforme documentação

### Logs de Auditoria

- Todos os webhooks são logados, incluindo falhas
- Headers, body e resposta são armazenados para auditoria
- Stack traces são capturados para debugging

## 🧪 Testes e Debugging

### Verificar Saúde do Sistema

```bash
curl https://seu-dominio.com/api/webhooks/bling
```

### Simular Webhook (Desenvolvimento)

```bash
curl -X POST https://seu-dominio.com/api/webhooks/bling \
  -H "Content-Type: application/json" \
  -H "X-Bling-Signature-256: sha256=sua_assinatura_hmac" \
  -d '{
    "eventId": "test-123",
    "date": "2024-09-27T11:24:56Z",
    "version": "v1",
    "event": "invoice.created",
    "companyId": "test-company",
    "data": {
      "id": 12345678,
      "tipo": 1,
      "situacao": 1,
      "numero": "123",
      "dataEmissao": "2024-09-27 11:24:56",
      "dataOperacao": "2024-09-27 11:00:00"
    }
  }'
```

### Monitorar Logs

```bash
# Ver últimos logs de erro
curl "https://seu-dominio.com/api/webhooks/logs?status=error&pageSize=10"

# Ver estatísticas do último mês
curl "https://seu-dominio.com/api/invoices/stats?startDate=2024-09-01&endDate=2024-09-30"
```

## 🚨 Tratamento de Erros

### Tipos de Erro Capturados

1. **Assinatura HMAC inválida**: Webhook rejeitado
2. **JSON malformado**: Erro de parsing
3. **Campos obrigatórios ausentes**: Validação de estrutura
4. **Erro de banco de dados**: Problemas de conectividade/constraint
5. **Timeout**: Processamento que excede 5 segundos

### Estratégias de Recovery

- **Idempotência**: Webhooks duplicados são ignorados
- **Logs detalhados**: Todos os erros são logados com stack trace
- **Retry automático**: O Bling tenta reenviar por até 3 dias
- **Graceful degradation**: Erros de log não afetam o processamento principal

## 📊 Monitoramento

### Métricas Importantes

- Taxa de sucesso vs erro dos webhooks
- Tempo médio de processamento
- Tipos de evento mais comuns
- Padrões de erro (IPs, user agents, etc.)

### Dashboards Recomendados

1. **Operacional**: Taxa de sucesso, tempo de resposta, volume
2. **Negócio**: Notas fiscais por tipo, valor total processado
3. **Erro**: Logs de erro, padrões de falha, retry rates

## 🔄 Manutenção

### Limpeza de Logs (Recomendado)

```sql
-- Manter logs dos últimos 90 dias
DELETE FROM webhook_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

### Backup Recomendado

- Backup diário das tabelas `invoices` e `webhook_logs`
- Retenção de 1 ano para dados de notas fiscais
- Retenção de 3 meses para logs de webhook

## 📚 Referências

- [Documentação Oficial do Bling](https://developer.bling.com.br/webhooks)
- [Especificação HMAC SHA-256](https://tools.ietf.org/html/rfc2104)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
