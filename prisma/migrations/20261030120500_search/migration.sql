CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "Product_searchText_trgm" ON "Product" USING GIN ("searchText" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "OemNumber_normalized_trgm" ON "OemNumber" USING GIN ("normalized" gin_trgm_ops);
CREATE SEQUENCE IF NOT EXISTS order_number_seq;
