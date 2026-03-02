-- ============================================================
-- TASK-A04: Orders & Checkout
-- Tables: addresses, orders, order_items
-- Enums: order_status, payment_status
-- Functions: generate_order_number, checkout_order, increment_stock
-- ============================================================

-- ── Enums ──────────────────────────────────────────────────

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded'
);

-- ── Sequence for order numbers ─────────────────────────────

CREATE SEQUENCE order_number_seq START 1;

-- ── Addresses table ────────────────────────────────────────

CREATE TABLE addresses (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label       text NOT NULL DEFAULT 'Home',
  full_name   text NOT NULL,
  phone       text NOT NULL,
  address_line_1 text NOT NULL,
  address_line_2 text,
  city        text NOT NULL,
  state       text NOT NULL,
  pincode     text NOT NULL,
  country     text NOT NULL DEFAULT 'India',
  is_default  boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_addresses_customer_id ON addresses(customer_id);

-- Updated_at trigger
CREATE TRIGGER set_addresses_updated_at
  BEFORE UPDATE ON addresses
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ── Orders table ───────────────────────────────────────────

CREATE TABLE orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number        text UNIQUE NOT NULL,
  customer_id         uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status              order_status NOT NULL DEFAULT 'pending',
  payment_status      payment_status NOT NULL DEFAULT 'pending',
  payment_method      text NOT NULL CHECK (payment_method IN ('cod', 'razorpay')),
  subtotal            numeric(12,2) NOT NULL DEFAULT 0,
  discount            numeric(12,2) NOT NULL DEFAULT 0,
  shipping_fee        numeric(12,2) NOT NULL DEFAULT 0,
  total               numeric(12,2) NOT NULL DEFAULT 0,
  shipping_address    jsonb NOT NULL,
  billing_address     jsonb,
  razorpay_order_id   text,
  razorpay_payment_id text,
  razorpay_signature  text,
  notes               text,
  cancelled_reason    text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_customer_id     ON orders(customer_id);
CREATE INDEX idx_orders_order_number    ON orders(order_number);
CREATE INDEX idx_orders_status          ON orders(status);
CREATE INDEX idx_orders_payment_status  ON orders(payment_status);
CREATE INDEX idx_orders_created_at      ON orders(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- ── Order Items table ──────────────────────────────────────

CREATE TABLE order_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name  text NOT NULL,
  product_slug  text NOT NULL,
  product_image text,
  price         numeric(12,2) NOT NULL,
  quantity      integer NOT NULL CHECK (quantity > 0),
  total         numeric(12,2) NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- ── Function: generate_order_number ────────────────────────

CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_val integer;
BEGIN
  seq_val := nextval('order_number_seq');
  RETURN 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq_val::text, 4, '0');
END;
$$;

-- ── Function: checkout_order (atomic) ──────────────────────

CREATE OR REPLACE FUNCTION checkout_order(
  p_customer_id     uuid,
  p_shipping_address jsonb,
  p_billing_address  jsonb DEFAULT NULL,
  p_notes            text  DEFAULT NULL,
  p_payment_method   text  DEFAULT 'cod'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_cart_id       uuid;
  v_order_id      uuid;
  v_order_number  text;
  v_subtotal      numeric(12,2) := 0;
  v_total         numeric(12,2) := 0;
  v_item          record;
  v_product       record;
  v_line_total    numeric(12,2);
  v_primary_image text;
BEGIN
  -- 1. Get customer's cart
  SELECT id INTO v_cart_id
  FROM carts
  WHERE customer_id = p_customer_id;

  IF v_cart_id IS NULL THEN
    RAISE EXCEPTION 'Cart not found';
  END IF;

  -- 2. Check cart has items
  IF NOT EXISTS (SELECT 1 FROM cart_items WHERE cart_id = v_cart_id) THEN
    RAISE EXCEPTION 'Cart is empty';
  END IF;

  -- 3. Generate order number
  v_order_number := generate_order_number();

  -- 4. Create the order
  INSERT INTO orders (
    order_number, customer_id, status, payment_status,
    payment_method, shipping_address, billing_address, notes
  )
  VALUES (
    v_order_number, p_customer_id,
    CASE WHEN p_payment_method = 'cod' THEN 'confirmed'::order_status ELSE 'pending'::order_status END,
    CASE WHEN p_payment_method = 'cod' THEN 'pending'::payment_status ELSE 'pending'::payment_status END,
    p_payment_method, p_shipping_address, p_billing_address, p_notes
  )
  RETURNING id INTO v_order_id;

  -- 5. Process each cart item
  FOR v_item IN
    SELECT ci.product_id, ci.quantity
    FROM cart_items ci
    WHERE ci.cart_id = v_cart_id
  LOOP
    -- Lock the product row to prevent overselling
    SELECT id, name, slug, price, stock, is_active
    INTO v_product
    FROM products
    WHERE id = v_item.product_id
    FOR UPDATE;

    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product % not found', v_item.product_id;
    END IF;

    IF NOT v_product.is_active THEN
      RAISE EXCEPTION 'Product "%" is not available', v_product.name;
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Available: %, Requested: %',
        v_product.name, v_product.stock, v_item.quantity;
    END IF;

    -- Get primary image
    SELECT url INTO v_primary_image
    FROM product_images
    WHERE product_id = v_item.product_id AND is_primary = true
    LIMIT 1;

    IF v_primary_image IS NULL THEN
      SELECT url INTO v_primary_image
      FROM product_images
      WHERE product_id = v_item.product_id
      ORDER BY sort_order ASC
      LIMIT 1;
    END IF;

    -- Calculate line total
    v_line_total := v_product.price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;

    -- Insert order item
    INSERT INTO order_items (
      order_id, product_id, product_name, product_slug,
      product_image, price, quantity, total
    )
    VALUES (
      v_order_id, v_item.product_id, v_product.name, v_product.slug,
      v_primary_image, v_product.price, v_item.quantity, v_line_total
    );

    -- Decrement stock
    UPDATE products
    SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id;
  END LOOP;

  -- 6. Update order totals
  v_total := v_subtotal; -- No discount or shipping for now
  UPDATE orders
  SET subtotal = v_subtotal, total = v_total
  WHERE id = v_order_id;

  -- 7. Clear cart
  DELETE FROM cart_items WHERE cart_id = v_cart_id;

  -- 8. Return result
  RETURN jsonb_build_object(
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'total', v_total
  );
END;
$$;

-- ── Function: increment_stock ──────────────────────────────

CREATE OR REPLACE FUNCTION increment_stock(
  p_product_id uuid,
  p_amount     integer
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE products
  SET stock = stock + p_amount
  WHERE id = p_product_id;
END;
$$;

-- ── RLS Policies ───────────────────────────────────────────

ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS, so no policies needed for admin access.
-- These are defensive; API routes use service-role client.

-- ── Permission Seeds ───────────────────────────────────────

INSERT INTO permissions (name, resource, action, description) VALUES
  ('order.view',   'order', 'view',   'View orders'),
  ('order.edit',   'order', 'edit',   'Edit / update order status'),
  ('order.delete', 'order', 'delete', 'Delete orders');

-- Grant order permissions to super_admin and admin roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('super_admin', 'admin')
  AND p.name IN ('order.view', 'order.edit', 'order.delete')
ON CONFLICT DO NOTHING;

-- Grant order.view to product_manager and viewer roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('product_manager', 'viewer')
  AND p.name = 'order.view'
ON CONFLICT DO NOTHING;
