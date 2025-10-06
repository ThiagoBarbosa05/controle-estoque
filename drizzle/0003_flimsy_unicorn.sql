ALTER TABLE "wines" ADD COLUMN "external_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "wines" ADD CONSTRAINT "wines_external_id_unique" UNIQUE("external_id");