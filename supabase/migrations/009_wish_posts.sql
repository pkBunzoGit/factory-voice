-- Wish posts for event-based social media content
CREATE TABLE IF NOT EXISTS wish_posts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factory_id uuid NOT NULL REFERENCES factories(id) ON DELETE CASCADE,
  event_name text NOT NULL,
  event_date text NOT NULL,
  image_url text NOT NULL,
  caption text NOT NULL,
  generation_number int NOT NULL DEFAULT 1,
  year int NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wish_posts_factory ON wish_posts(factory_id);
CREATE INDEX IF NOT EXISTS idx_wish_posts_event ON wish_posts(factory_id, event_date, year);
