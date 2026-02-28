-- ============================================================
-- TASK-A05: Wishlist
-- Table: wishlists (customer_id, product_id, created_at)
-- ============================================================

CREATE TABLE wishlists (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (customer_id, product_id)
);

CREATE INDEX idx_wishlists_customer_id ON wishlists(customer_id);
CREATE INDEX idx_wishlists_product_id  ON wishlists(product_id);

-- ── RLS ────────────────────────────────────────────────────

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
