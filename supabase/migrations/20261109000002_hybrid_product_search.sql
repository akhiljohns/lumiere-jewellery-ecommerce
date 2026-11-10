-- ============================================================
-- Hybrid product search for the shopping assistant
-- Hard filters first, then full-text and vector ranks fused with
-- reciprocal rank fusion (Supabase hybrid-search pattern, k = 50).
-- ============================================================

create or replace function public.search_products_hybrid(
  query_text      text,
  query_embedding vector(768) default null,
  category_ids    uuid[]      default null,
  material_names  text[]      default null,
  min_price       numeric     default null,
  max_price       numeric     default null,
  in_stock_only   boolean     default false,
  on_sale_only    boolean     default false,
  match_count     int         default 5,
  min_similarity  float       default 0.5,
  rrf_k           int         default 50
)
returns table (
  id             uuid,
  name           text,
  slug           text,
  description    text,
  price          numeric,
  compare_price  numeric,
  material       text,
  weight         text,
  stock          int,
  is_featured    boolean,
  category_name  text,
  text_rank      bigint,
  semantic_rank  bigint,
  similarity     float,
  score          float
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  with filtered as (
    select p.*
    from products p
    where p.is_active
      and (category_ids   is null or p.category_id = any(category_ids))
      and (material_names is null or p.material    = any(material_names))
      and (min_price      is null or p.price >= min_price)
      and (max_price      is null or p.price <= max_price)
      and (not in_stock_only or p.stock > 0)
      and (not on_sale_only  or (p.compare_price is not null and p.compare_price > p.price))
  ),
  -- Any word may match (OR), unlike websearch_to_tsquery which needs every word.
  q as (
    select nullif(
      replace(plainto_tsquery('english', coalesce(query_text, ''))::text, ' & ', ' | '),
      ''
    )::tsquery as tsq
  ),
  full_text as (
    select f.id,
           row_number() over (order by ts_rank_cd(f.search_vector, q.tsq) desc) as rank_ix
    from filtered f, q
    where q.tsq is not null
      and f.search_vector @@ q.tsq
    order by rank_ix
    limit least(match_count, 30) * 2
  ),
  semantic as (
    select pe.product_id as id,
           row_number() over (order by min(pe.embedding <=> query_embedding)) as rank_ix,
           max(1 - (pe.embedding <=> query_embedding)) as similarity
    from product_embeddings pe
    join filtered f on f.id = pe.product_id
    where query_embedding is not null
    group by pe.product_id
    having max(1 - (pe.embedding <=> query_embedding)) >= min_similarity
    order by rank_ix
    limit least(match_count, 30) * 2
  ),
  -- When the customer gave filters, products that satisfy them are candidates even if
  -- no word or meaning matched ("show me rings under 5000"). Low weight, so real matches lead.
  filter_only as (
    select f.id,
           row_number() over (order by (f.stock > 0) desc, f.is_featured desc, f.price asc) as rank_ix
    from filtered f
    where category_ids is not null
       or material_names is not null
       or min_price is not null
       or max_price is not null
       or in_stock_only
       or on_sale_only
    order by rank_ix
    limit least(match_count, 30) * 2
  )
  select f.id, f.name, f.slug, f.description, f.price, f.compare_price, f.material, f.weight,
         f.stock, f.is_featured, c.name as category_name,
         ft.rank_ix as text_rank, s.rank_ix as semantic_rank, s.similarity,
         coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0)
       + coalesce(1.0 / (rrf_k + s.rank_ix), 0.0)
       + coalesce(1.0 / (rrf_k + fo.rank_ix), 0.0) * 0.25 as score
  from filtered f
  left join full_text   ft on ft.id = f.id
  left join semantic    s  on s.id  = f.id
  left join filter_only fo on fo.id = f.id
  left join categories  c  on c.id  = f.category_id
  where ft.id is not null or s.id is not null or fo.id is not null
  order by score desc, f.is_featured desc, f.price asc
  limit least(match_count, 30)
$$;

-- Server-side only: the app calls it with the service role.
revoke execute on function public.search_products_hybrid from public, anon, authenticated;
grant execute on function public.search_products_hybrid to service_role;
