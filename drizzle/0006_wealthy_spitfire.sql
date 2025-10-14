ALTER TABLE "wines" ADD COLUMN "min_stock" integer DEFAULT 0 NOT NULL;

ALTER TABLE wines
ALTER COLUMN in_stock DROP DEFAULT;

ALTER TABLE "wines"
ALTER COLUMN "in_stock" TYPE integer
USING "in_stock"::integer;

ALTER TABLE wines
ALTER COLUMN in_stock SET DEFAULT 0;