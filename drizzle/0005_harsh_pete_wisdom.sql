CREATE TABLE "erp_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"erp_name" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_in" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bling_id" text NOT NULL,
	"tipo" integer NOT NULL,
	"situacao" integer NOT NULL,
	"numero" text NOT NULL,
	"data_emissao" timestamp NOT NULL,
	"data_operacao" timestamp NOT NULL,
	"contato_id" text,
	"natureza_operacao_id" text,
	"loja_id" text,
	"valor_total" numeric(15, 2),
	"raw_data" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_bling_id_unique" UNIQUE("bling_id")
);
--> statement-breakpoint
CREATE TABLE "webhook_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"resource_id" text,
	"status" text NOT NULL,
	"status_code" integer,
	"error_message" text,
	"error_stack" text,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	"processing_time" integer,
	"request_headers" jsonb,
	"request_body" jsonb NOT NULL,
	"response_body" jsonb,
	"ip_address" text,
	"user_agent" text,
	"signature" text,
	"signature_valid" boolean,
	"retry_attempt" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "invoices_bling_id_idx" ON "invoices" USING btree ("bling_id");--> statement-breakpoint
CREATE INDEX "invoices_data_emissao_idx" ON "invoices" USING btree ("data_emissao");--> statement-breakpoint
CREATE INDEX "invoices_situacao_idx" ON "invoices" USING btree ("situacao");--> statement-breakpoint
CREATE INDEX "webhook_logs_event_id_idx" ON "webhook_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "webhook_logs_event_type_idx" ON "webhook_logs" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "webhook_logs_status_idx" ON "webhook_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "webhook_logs_processed_at_idx" ON "webhook_logs" USING btree ("processed_at");