ALTER TABLE shopping_items
ADD COLUMN IF NOT EXISTS unit TEXT
CHECK (unit IN ('units', 'grams', 'milliliters'))
DEFAULT 'units';
