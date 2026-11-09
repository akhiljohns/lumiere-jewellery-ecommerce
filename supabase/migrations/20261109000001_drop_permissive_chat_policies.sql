-- ============================================================
-- The chat and embedding tables had "Service role full access" policies with
-- USING (true) and no TO clause, which granted anon and authenticated full
-- read/write. The service role bypasses RLS and never needed them.
-- With RLS on and no policy, only the service role can reach these tables.
-- ============================================================
drop policy if exists "Service role full access on product_embeddings" on public.product_embeddings;
drop policy if exists "Service role full access on chat_conversations" on public.chat_conversations;
drop policy if exists "Service role full access on chat_messages"      on public.chat_messages;
