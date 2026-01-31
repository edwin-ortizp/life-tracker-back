-- ============================================================================
-- SHOPPING ITEMS TABLE
-- ============================================================================

CREATE TABLE shopping_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stock INTEGER DEFAULT 0,
  to_buy INTEGER DEFAULT 0,
  price NUMERIC,
  category TEXT,
  place TEXT,
  consume_by DATE,
  status TEXT CHECK (status IN ('in-stock', 'to-buy', 'low-stock')) NOT NULL,
  next_purchase BOOLEAN DEFAULT false,
  unit TEXT CHECK (unit IN ('units', 'grams', 'milliliters')) DEFAULT 'units',
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_shopping_items_user_status ON shopping_items(user_id, status);
CREATE INDEX idx_shopping_items_barcode ON shopping_items(barcode) WHERE barcode IS NOT NULL;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_shopping_items" ON shopping_items
  FOR ALL USING (user_id = current_setting('request.jwt.claim.sub', true));
