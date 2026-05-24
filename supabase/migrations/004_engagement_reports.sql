-- Live engagement reports: 1 row per factory, overwritten on each refresh
CREATE TABLE IF NOT EXISTS engagement_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  report_data jsonb NOT NULL DEFAULT '{}',
  summary jsonb NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(factory_id)
);

-- Weekly engagement reports: rolling 3 weeks per factory
CREATE TABLE IF NOT EXISTS weekly_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  report_data jsonb NOT NULL DEFAULT '{}',
  generated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(factory_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_engagement_reports_factory ON engagement_reports(factory_id);
CREATE INDEX IF NOT EXISTS idx_weekly_reports_factory_week ON weekly_reports(factory_id, week_start DESC);
