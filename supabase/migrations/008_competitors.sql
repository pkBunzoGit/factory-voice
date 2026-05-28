-- Competitors table for competitive analysis
CREATE TABLE IF NOT EXISTS competitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text,
  products_summary text,
  strengths text,
  weaknesses text,
  is_ai_generated boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_competitors_factory ON competitors(factory_id);

-- Store the overall competitive analysis report
CREATE TABLE IF NOT EXISTS competitive_reports (
  factory_id uuid PRIMARY KEY REFERENCES factories(id) ON DELETE CASCADE,
  report_data jsonb NOT NULL DEFAULT '{}',
  generated_at timestamptz DEFAULT now()
);
