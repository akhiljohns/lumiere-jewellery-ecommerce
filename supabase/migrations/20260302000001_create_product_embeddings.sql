-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Product embeddings for RAG chatbot
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding vector(768) NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One embedding per product (can have multiple chunks per product)
CREATE INDEX idx_product_embeddings_product_id ON product_embeddings(product_id);

-- IVFFlat index for fast approximate nearest neighbor search
-- Note: requires at least some rows to exist before creating IVFFlat,
-- so we use HNSW index which works on empty tables
CREATE INDEX idx_product_embeddings_vector ON product_embeddings
  USING hnsw (embedding vector_cosine_ops);

-- Chat conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_conversations_customer ON chat_conversations(customer_id);
CREATE INDEX idx_chat_conversations_session ON chat_conversations(session_id);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  context_product_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_messages_conversation ON chat_messages(conversation_id);

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_product_embeddings(
  query_embedding vector(768),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  product_id UUID,
  chunk_text TEXT,
  similarity FLOAT,
  metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.product_id,
    pe.chunk_text,
    1 - (pe.embedding <=> query_embedding) AS similarity,
    pe.metadata
  FROM product_embeddings pe
  JOIN products p ON p.id = pe.product_id
  WHERE p.is_active = true
    AND 1 - (pe.embedding <=> query_embedding) > match_threshold
  ORDER BY pe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- RLS policies
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by admin client)
CREATE POLICY "Service role full access on product_embeddings"
  ON product_embeddings FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on chat_conversations"
  ON chat_conversations FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on chat_messages"
  ON chat_messages FOR ALL
  USING (true) WITH CHECK (true);
