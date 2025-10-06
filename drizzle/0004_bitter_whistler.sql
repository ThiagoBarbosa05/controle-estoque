ALTER TABLE "wines" ALTER COLUMN "country" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wines" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "wines" ALTER COLUMN "in_stock" SET DEFAULT '0';--> statement-breakpoint
ALTER TABLE "wines" ALTER COLUMN "size" DROP NOT NULL;