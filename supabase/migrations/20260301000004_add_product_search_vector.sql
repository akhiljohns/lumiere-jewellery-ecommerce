-- ============================================================
-- Migration: Add full-text search vector to products
-- TASK-A07-A: tsvector column + GIN index + auto-update trigger
-- ============================================================

-- 1. Add tsvector column
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- 3. Function to generate search vector from product fields
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.material, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger to auto-update search_vector on insert/update
DROP TRIGGER IF EXISTS trg_products_search_vector ON products;
CREATE TRIGGER trg_products_search_vector
  BEFORE INSERT OR UPDATE OF name, description, material
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_search_vector_update();

-- 5. Backfill existing products
UPDATE products SET
  search_vector =
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(material, '')), 'C');

-- 6. Add is_featured column for curated featured products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

-- 7. Index for featured products query
CREATE INDEX IF NOT EXISTS idx_products_is_featured
  ON products (is_featured) WHERE is_featured = true;

-- 8. Additional indexes for public storefront queries
CREATE INDEX IF NOT EXISTS idx_products_material
  ON products (material) WHERE material IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_price
  ON products (price);

CREATE INDEX IF NOT EXISTS idx_products_is_active
  ON products (is_active) WHERE is_active = true;
