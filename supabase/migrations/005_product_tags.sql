-- Add tags column to products table for flexible key-value metadata
-- e.g. {"warranty": "2 years", "material": "LDPE", "certification": "ISI"}
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '{}';
