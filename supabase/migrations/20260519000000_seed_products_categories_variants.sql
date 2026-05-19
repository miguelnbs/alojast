-- Seed/repair store catalog data used by the public pages.
-- This makes the category pages, product pages, variant selection and checkout flow usable.

-- 1) Categories used by the home page links: /c/camisas, /c/fones, /c/smartwatch, /c/eletronicos
INSERT INTO public.categories (slug, name, description, image_url, sort_order)
VALUES
  ('camisas', 'Camisas', 'Times, retrôs e casuais', 'cat-camisas.jpg', 1),
  ('fones', 'Fones', 'Bluetooth, in-ear e gamer', 'cat-fones.jpg', 2),
  ('smartwatch', 'Smartwatch', 'Modelos novos e clássicos', 'cat-smartwatch.jpg', 3),
  ('eletronicos', 'Eletrônicos', 'Cabos, caixinhas e gadgets', 'cat-eletronicos.jpg', 4)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  sort_order = EXCLUDED.sort_order;

-- 2) Products linked to the correct category_id, with active=true so public category pages can read them.
WITH seed_products AS (
  SELECT * FROM (VALUES
    ('fone-bluetooth-premium', 'Fone Bluetooth Premium', 'Fone bluetooth com bateria de longa duração e som imersivo.', 'ST', 12990, 9990, 'fone-1.jpg', 'fones', 12, true),
    ('fone-gamer-rgb', 'Headset Gamer RGB', 'Headset gamer com microfone ajustável e acabamento confortável.', 'ST', 18990, 14990, 'fone-2.jpg', 'fones', 8, true),
    ('fone-in-ear-pro', 'Fone In-Ear Pro', 'Fone compacto para uso diário com ótima qualidade de áudio.', 'ST', 8990, NULL::int, 'fone-3.jpg', 'fones', 15, false),
    ('fone-bluetooth-basic', 'Fone Bluetooth Basic', 'Modelo leve, prático e ideal para rotina.', 'ST', 7990, NULL::int, 'fone-4.jpg', 'fones', 20, false),

    ('smartwatch-serie-y', 'Smartwatch Série Y', 'Smartwatch com notificações, contador de passos e monitoramento.', 'ST', 24990, 19990, 'watch-1.jpg', 'smartwatch', 10, true),
    ('smartwatch-classic', 'Smartwatch Classic', 'Modelo clássico com pulseira confortável.', 'ST', 21990, NULL::int, 'watch-2.jpg', 'smartwatch', 7, false),
    ('smartwatch-sport', 'Smartwatch Sport', 'Visual esportivo, resistente e ótimo para o dia a dia.', 'ST', 27990, 22990, 'watch-3.jpg', 'smartwatch', 6, true),
    ('smartwatch-mini', 'Smartwatch Mini', 'Modelo compacto com recursos essenciais.', 'ST', 16990, NULL::int, 'watch-4.jpg', 'smartwatch', 14, false),

    ('camisa-time-retro', 'Camisa Retrô Oficial', 'Camisa retrô estilo futebol, tecido leve e confortável.', 'ST', 15990, 12990, 'camisa-1.jpg', 'camisas', 20, true),
    ('camisa-casual-st', 'Camisa Casual ST', 'Camisa casual para o dia a dia.', 'ST', 9990, NULL::int, 'camisa-2.jpg', 'camisas', 18, false),
    ('camisa-europeia-premium', 'Camisa Europeia Premium', 'Camisa estilo europeu com acabamento premium.', 'ST', 18990, 15990, 'camisa-3.jpg', 'camisas', 12, true),
    ('camisa-nacional', 'Camisa Nacional', 'Camisa de time nacional com tecido confortável.', 'ST', 13990, NULL::int, 'camisa-4.jpg', 'camisas', 16, false),

    ('caixa-som-portatil', 'Caixa de Som Portátil', 'Caixa bluetooth compacta com som potente.', 'ST', 17990, 13990, 'elet-1.jpg', 'eletronicos', 9, true),
    ('cabo-usb-c-premium', 'Cabo USB-C Premium', 'Cabo reforçado para carregamento rápido.', 'ST', 4990, NULL::int, 'elet-2.jpg', 'eletronicos', 25, false),
    ('carregador-rapido', 'Carregador Rápido', 'Carregador compacto para rotina e viagens.', 'ST', 6990, NULL::int, 'elet-3.jpg', 'eletronicos', 22, false),
    ('suporte-celular', 'Suporte para Celular', 'Suporte prático para mesa, estudo e trabalho.', 'ST', 3990, NULL::int, 'elet-4.jpg', 'eletronicos', 30, false)
  ) AS p(slug, name, description, brand, price_cents, sale_price_cents, image_url, category_slug, stock, featured)
)
INSERT INTO public.products (
  slug, name, description, brand, price_cents, sale_price_cents, image_url, images,
  category_id, stock, featured, active
)
SELECT
  p.slug, p.name, p.description, p.brand, p.price_cents, p.sale_price_cents, p.image_url,
  ARRAY[p.image_url]::text[], c.id, p.stock, p.featured, true
FROM seed_products p
JOIN public.categories c ON c.slug = p.category_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  brand = EXCLUDED.brand,
  price_cents = EXCLUDED.price_cents,
  sale_price_cents = EXCLUDED.sale_price_cents,
  image_url = EXCLUDED.image_url,
  images = EXCLUDED.images,
  category_id = EXCLUDED.category_id,
  stock = EXCLUDED.stock,
  featured = EXCLUDED.featured,
  active = true;

-- 3) Variants/options. Product page only shows the size/option selector when rows exist here.
-- Delete only the variants for this seed catalog to avoid duplicates, then insert the corrected list.
DELETE FROM public.product_variants pv
USING public.products p
WHERE pv.product_id = p.id
  AND p.slug IN (
    'fone-bluetooth-premium','fone-gamer-rgb','fone-in-ear-pro','fone-bluetooth-basic',
    'smartwatch-serie-y','smartwatch-classic','smartwatch-sport','smartwatch-mini',
    'camisa-time-retro','camisa-casual-st','camisa-europeia-premium','camisa-nacional',
    'caixa-som-portatil','cabo-usb-c-premium','carregador-rapido','suporte-celular'
  );

WITH variant_seed AS (
  SELECT * FROM (VALUES
    ('camisa-time-retro', 'P', 4), ('camisa-time-retro', 'M', 6), ('camisa-time-retro', 'G', 6), ('camisa-time-retro', 'GG', 4),
    ('camisa-casual-st', 'P', 4), ('camisa-casual-st', 'M', 6), ('camisa-casual-st', 'G', 5), ('camisa-casual-st', 'GG', 3),
    ('camisa-europeia-premium', 'P', 2), ('camisa-europeia-premium', 'M', 4), ('camisa-europeia-premium', 'G', 4), ('camisa-europeia-premium', 'GG', 2),
    ('camisa-nacional', 'P', 3), ('camisa-nacional', 'M', 5), ('camisa-nacional', 'G', 5), ('camisa-nacional', 'GG', 3),

    ('fone-bluetooth-premium', 'Preto', 5), ('fone-bluetooth-premium', 'Branco', 4), ('fone-bluetooth-premium', 'Azul', 3),
    ('fone-gamer-rgb', 'Preto', 5), ('fone-gamer-rgb', 'Branco', 3),
    ('fone-in-ear-pro', 'Preto', 8), ('fone-in-ear-pro', 'Branco', 7),
    ('fone-bluetooth-basic', 'Preto', 10), ('fone-bluetooth-basic', 'Branco', 10),

    ('smartwatch-serie-y', 'Preto', 4), ('smartwatch-serie-y', 'Prata', 3), ('smartwatch-serie-y', 'Rosa', 3),
    ('smartwatch-classic', 'Preto', 4), ('smartwatch-classic', 'Marrom', 3),
    ('smartwatch-sport', 'Preto', 3), ('smartwatch-sport', 'Azul', 3),
    ('smartwatch-mini', 'Preto', 7), ('smartwatch-mini', 'Rosa', 7),

    ('caixa-som-portatil', 'Preto', 5), ('caixa-som-portatil', 'Azul', 4),
    ('cabo-usb-c-premium', '1 metro', 15), ('cabo-usb-c-premium', '2 metros', 10),
    ('carregador-rapido', '20W', 12), ('carregador-rapido', '30W', 10),
    ('suporte-celular', 'Preto', 15), ('suporte-celular', 'Branco', 15)
  ) AS v(product_slug, name, stock)
)
INSERT INTO public.product_variants (product_id, name, stock)
SELECT p.id, v.name, v.stock
FROM variant_seed v
JOIN public.products p ON p.slug = v.product_slug;

-- 4) Keep public site settings aligned with the visible checkout/payment model.
INSERT INTO public.site_settings (key, value) VALUES
  ('marquee', jsonb_build_array('PIX','CARTÃO','DINHEIRO','MOTOBOY','ENTREGA RÁPIDA','GARANTIA','SINCE 2018','A LOJA ST')),
  ('faq', jsonb_build_array(
    jsonb_build_object('q','Quais formas de pagamento?','a','Pix, cartão de crédito/débito e dinheiro na entrega. A confirmação é combinada pelo WhatsApp após o pedido.'),
    jsonb_build_object('q','Quanto tempo demora a entrega?','a','Pedidos confirmados são enviados por motoboy no mesmo dia em horário comercial, conforme disponibilidade.'),
    jsonb_build_object('q','Posso escolher tamanho ou modelo?','a','Sim. Produtos com variações mostram as opções disponíveis na página do produto antes de adicionar à sacola.'),
    jsonb_build_object('q','Posso trocar um produto?','a','Sim, você tem até 7 dias para solicitar troca direto da sua conta.')
  ))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
