CREATE TABLE "customer_wines_list" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" text NOT NULL,
	"wine_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wines" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"type" text NOT NULL,
	"in_stock" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"size" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "customer_wines_list" ADD CONSTRAINT "customer_wines_list_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_wines_list" ADD CONSTRAINT "customer_wines_list_wine_id_wines_id_fk" FOREIGN KEY ("wine_id") REFERENCES "public"."wines"("id") ON DELETE no action ON UPDATE no action;