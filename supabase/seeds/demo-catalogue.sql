-- ================================================
-- Demo catalogue: 42 invented products for development and the assistant eval set.
-- Not real stock. Prices are illustrative.
-- Load locally:  psql "$DATABASE_URL" -f supabase/seeds/demo-catalogue.sql
-- Then generate embeddings: pnpm embed:products
-- ================================================

insert into public.categories (name, slug, sort_order) values
  ('Rings',            'rings',            1),
  ('Engagement Rings', 'engagement-rings', 2),
  ('Necklaces',        'necklaces',        3),
  ('Earrings',         'earrings',         4),
  ('Bangles',          'bangles',          5),
  ('Chains',           'chains',           6),
  ('Bridal Sets',      'bridal-sets',      7)
on conflict (slug) do nothing;

with demo (name, slug, category_slug, material, price, compare_price, weight, stock, is_featured, description) as (
  values
  -- Rings (7)
  ('Simple Silver Band', 'simple-silver-band', 'rings', '925 Sterling Silver', 2500, null, '3.1 g', 7, false,
   'A plain polished sterling silver band with a comfort-fit inner edge. Light enough for daily office wear.'),
  ('Twisted Rope Silver Ring', 'twisted-rope-silver-ring', 'rings', '925 Sterling Silver', 1800, 2200, '2.6 g', 14, false,
   'Two strands of silver twisted into a rope pattern. A small, easy gift for friends and sisters.'),
  ('Rose Gold Leaf Ring', 'rose-gold-leaf-ring', 'rings', '18k Rose Gold', 18500, null, '2.4 g', 6, true,
   'A delicate rose gold ring shaped like a single leaf with a matte vein. Minimal and made for everyday stacking.'),
  ('Ruby Cocktail Ring', 'ruby-cocktail-ring', 'rings', '22k Yellow Gold', 62000, 71000, '7.8 g', 3, false,
   'An oval ruby surrounded by a halo of small gold beads. A statement ring for weddings and festive evenings.'),
  ('Men''s Signet Ring', 'mens-signet-ring', 'rings', '18k Yellow Gold', 38500, null, '8.9 g', 4, false,
   'A flat-top men''s signet ring in brushed yellow gold, ready for engraving initials. Solid, heavy and plain.'),
  ('Navaratna Ring', 'navaratna-ring', 'rings', '22k Yellow Gold', 54000, null, '6.2 g', 0, false,
   'Nine traditional gemstones set in a flower pattern on a 22k gold shank. A South Indian auspicious design.'),
  ('Gold-plated Stackable Trio', 'gold-plated-stackable-trio', 'rings', 'Gold-plated Silver', 2900, 3500, '4.0 g', 20, false,
   'Three thin gold-plated silver bands, one plain, one textured, one beaded. Wear together or apart.'),

  -- Engagement Rings (5)
  ('Diamond Solitaire Ring', 'diamond-solitaire-ring', 'engagement-rings', '18k White Gold', 45000, 55000, '3.5 g', 10, true,
   'A 1-carat lab-grown diamond in a six-prong white gold setting. The classic proposal ring.'),
  ('Platinum Halo Engagement Ring', 'platinum-halo-engagement-ring', 'engagement-rings', 'Platinum 950', 128000, null, '5.1 g', 2, false,
   'A round diamond framed by a halo of micro-pavé diamonds on a platinum band. Bright and hard-wearing.'),
  ('Rose Gold Oval Solitaire', 'rose-gold-oval-solitaire', 'engagement-rings', '18k Rose Gold', 52000, null, '3.3 g', 5, false,
   'An oval diamond in a low rose gold basket setting that sits close to the finger. Romantic and practical.'),
  ('Three-Stone Diamond Ring', 'three-stone-diamond-ring', 'engagement-rings', '18k Yellow Gold', 74000, 86000, '4.2 g', 3, false,
   'Three diamonds for past, present and future on a yellow gold band. A popular anniversary choice.'),
  ('Princess Cut Platinum Ring', 'princess-cut-platinum-ring', 'engagement-rings', 'Platinum 950', 98000, null, '4.6 g', 0, false,
   'A square princess-cut diamond held by four claws on a platinum band. Clean modern lines.'),

  -- Necklaces (7)
  ('Temple Lakshmi Necklace', 'temple-lakshmi-necklace', 'necklaces', '22k Yellow Gold', 142000, null, '38.0 g', 2, true,
   'Temple-style necklace with Lakshmi coin motifs and ruby drops. Made for Kerala and South Indian weddings.'),
  ('Silver Heart Pendant', 'silver-heart-pendant', 'necklaces', '925 Sterling Silver', 3200, 3900, '4.5 g', 18, false,
   'A small open heart pendant on an 18-inch silver chain. A ready-to-gift box is included.'),
  ('Rose Gold Bar Necklace', 'rose-gold-bar-necklace', 'necklaces', '18k Rose Gold', 21500, null, '3.0 g', 9, false,
   'A slim horizontal bar on a fine rose gold chain. Minimal enough for daily office wear.'),
  ('Emerald Drop Pendant', 'emerald-drop-pendant', 'necklaces', '18k Yellow Gold', 46000, 52000, '4.8 g', 4, false,
   'A pear-shaped emerald hanging from a diamond-set bail. Pairs well with green and red sarees.'),
  ('Kasu Mala Necklace', 'kasu-mala-necklace', 'necklaces', '22k Yellow Gold', 128000, null, '34.5 g', 1, false,
   'A traditional Kerala kasu mala of gold coins strung in a long necklace. A bridal and festival heirloom.'),
  ('Pearl Choker', 'pearl-choker', 'necklaces', 'Gold-plated Silver', 5800, null, '22.0 g', 8, false,
   'Freshwater pearls in three rows on a gold-plated silver clasp. Light enough for long functions.'),
  ('White Gold Diamond Line Necklace', 'white-gold-diamond-line-necklace', 'necklaces', '18k White Gold', 89000, null, '9.4 g', 0, false,
   'A single line of round diamonds set along a white gold chain. Evening and reception wear.'),

  -- Earrings (8)
  ('Silver Hoop Earrings', 'silver-hoop-earrings', 'earrings', '925 Sterling Silver', 2100, null, '5.2 g', 22, false,
   'Medium polished silver hoops with a click-shut hinge. Everyday earrings that go with anything.'),
  ('Rose Gold Stud Earrings', 'rose-gold-stud-earrings', 'earrings', '18k Rose Gold', 14500, 17000, '1.8 g', 12, true,
   'Small round rose gold studs with a single cubic zirconia each. Minimal daily-wear studs.'),
  ('Jhumka Earrings', 'jhumka-earrings', 'earrings', '22k Yellow Gold', 48000, null, '11.6 g', 5, false,
   'Bell-shaped temple jhumkas with tiny gold bead fringes. Traditional South Indian design for weddings.'),
  ('Diamond Drop Earrings', 'diamond-drop-earrings', 'earrings', '18k White Gold', 67000, 78000, '4.4 g', 3, false,
   'Graduated diamond drops that move when you turn your head. Made for receptions and evenings.'),
  ('Silver Oxidised Chandbali', 'silver-oxidised-chandbali', 'earrings', '925 Sterling Silver', 4200, null, '12.3 g', 9, false,
   'Crescent chandbali earrings in oxidised silver with small hanging beads. Pairs with cotton and handloom sarees.'),
  ('Gold-plated Tassel Earrings', 'gold-plated-tassel-earrings', 'earrings', 'Gold-plated Silver', 2600, 3200, '8.1 g', 16, false,
   'Long gold-plated tassels with a pearl cap. A light, festive gift.'),
  ('Yellow Gold Huggies', 'yellow-gold-huggies', 'earrings', '18k Yellow Gold', 16800, null, '2.2 g', 0, false,
   'Small hinged hoops that hug the earlobe. Minimal and comfortable to sleep in.'),
  ('Platinum Solitaire Studs', 'platinum-solitaire-studs', 'earrings', 'Platinum 950', 84000, null, '2.6 g', 2, false,
   'A pair of half-carat diamond studs in four-prong platinum settings. A milestone gift.'),

  -- Bangles (6)
  ('Kerala Kada Bangle', 'kerala-kada-bangle', 'bangles', '22k Yellow Gold', 96000, null, '24.0 g', 3, false,
   'A broad 22k gold kada with a hand-engraved floral border. A traditional Kerala bridal bangle.'),
  ('Rose Gold Cuff Bangle', 'rose-gold-cuff-bangle', 'bangles', '18k Rose Gold', 42000, 48000, '8.5 g', 6, false,
   'An open rose gold cuff with a brushed finish. Slips on easily for daily wear.'),
  ('Silver Twisted Bangle Pair', 'silver-twisted-bangle-pair', 'bangles', '925 Sterling Silver', 5400, null, '18.0 g', 11, false,
   'Two twisted sterling silver bangles sold as a pair. Simple and sturdy.'),
  ('Antique Temple Bangle Set', 'antique-temple-bangle-set', 'bangles', '22k Yellow Gold', 148000, null, '41.0 g', 1, false,
   'Four antique-finish temple bangles with goddess motifs and kemp stones. For weddings and festivals.'),
  ('Gold-plated Kids Bangles', 'gold-plated-kids-bangles', 'bangles', 'Gold-plated Silver', 2200, null, '9.0 g', 15, false,
   'A pair of small gold-plated bangles with smooth edges for children. A naming-ceremony gift.'),
  ('White Gold Tennis Bracelet', 'white-gold-tennis-bracelet', 'bangles', '18k White Gold', 88000, 99000, '10.2 g', 2, true,
   'A flexible line of diamonds in white gold with a box clasp. Elegant for office and evening.'),

  -- Chains (5)
  ('Men''s Curb Chain', 'mens-curb-chain', 'chains', '22k Yellow Gold', 112000, null, '28.0 g', 3, false,
   'A heavy 22-inch curb chain for men in 22k gold. Bold and solid.'),
  ('Silver Box Chain', 'silver-box-chain', 'chains', '925 Sterling Silver', 1900, null, '4.8 g', 25, false,
   'An 18-inch silver box chain strong enough for any pendant. The plain everyday chain.'),
  ('Rose Gold Singapore Chain', 'rose-gold-singapore-chain', 'chains', '18k Rose Gold', 24500, null, '3.6 g', 8, false,
   'A fine twisted Singapore chain in rose gold that catches the light. Minimal daily wear.'),
  ('Yellow Gold Rope Chain', 'yellow-gold-rope-chain', 'chains', '18k Yellow Gold', 36000, 41000, '6.9 g', 5, false,
   'A classic rope chain in 18k yellow gold. Works alone or with a pendant.'),
  ('Platinum Link Chain', 'platinum-link-chain', 'chains', 'Platinum 950', 72000, null, '12.0 g', 0, false,
   'A clean-cut platinum link chain for men. Does not tarnish.'),

  -- Bridal Sets (4)
  ('Kerala Bridal Set', 'kerala-bridal-set', 'bridal-sets', '22k Yellow Gold', 149000, null, '46.0 g', 1, true,
   'A palakka necklace, matching jhumkas and a nethichutti in 22k gold. A full Kerala Christian and Hindu bridal set.'),
  ('Kundan Bridal Set', 'kundan-bridal-set', 'bridal-sets', 'Gold-plated Silver', 5900, 7200, '64.0 g', 4, false,
   'A kundan necklace and earring set in gold-plated silver with green drops. North Indian bridal style.'),
  ('Diamond Reception Set', 'diamond-reception-set', 'bridal-sets', '18k White Gold', 139000, null, '18.5 g', 1, false,
   'A diamond necklace and drop earrings in white gold for the reception evening. Matching, light and bright.'),
  ('Temple Bridal Set', 'temple-bridal-set', 'bridal-sets', '22k Yellow Gold', 147000, null, '52.0 g', 2, false,
   'A temple necklace, jhumkas and vanki armlet with ruby and emerald kemp stones. South Indian bridal.')
)
insert into public.products
  (name, slug, category_id, material, price, compare_price, weight, stock, is_featured, description, is_active)
select d.name, d.slug, c.id, d.material, d.price, d.compare_price, d.weight, d.stock, d.is_featured, d.description, true
from demo d
join public.categories c on c.slug = d.category_slug
on conflict (slug) do nothing;
