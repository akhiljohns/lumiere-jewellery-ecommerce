-- Media library table for centralized image management
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  filename TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  folder TEXT DEFAULT 'jewellery-ecommerce/products',
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_media_public_id ON media(public_id);
CREATE INDEX idx_media_created_at ON media(created_at DESC);
