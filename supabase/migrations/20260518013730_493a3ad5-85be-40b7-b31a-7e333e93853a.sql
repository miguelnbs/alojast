
CREATE TABLE IF NOT EXISTS public.site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings public read"
  ON public.site_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Site settings admin write"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_site_settings_updated
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_settings (key, value) VALUES
  ('hero', jsonb_build_object(
    'badge', '+5.000 produtos vendidos',
    'title_line1', 'PEDIU,',
    'title_line2', 'CHEGOU.',
    'subtitle', 'Eletrônicos, camisas, fones, smartwatches e variedades com a confiança de quem já entregou pra mais de 5 mil clientes. Entrega por motoboy. Pix, cartão e dinheiro.',
    'cta_primary', 'Fazer meu pedido',
    'cta_secondary', 'Ver categorias'
  )),
  ('stats', jsonb_build_array(
    jsonb_build_object('k','6.087','v','seguidores no IG'),
    jsonb_build_object('k','+5K','v','produtos vendidos'),
    jsonb_build_object('k','2018','v','fundada em')
  )),
  ('marquee', jsonb_build_array('PIX','CARTÃO','DINHEIRO','MOTOBOY','ENTREGA RÁPIDA','GARANTIDA','SINCE 2018','ST ELETRÔNICOS')),
  ('contact', jsonb_build_object(
    'instagram','https://www.instagram.com/alojast/',
    'whatsapp','https://wa.me/?text=Ol%C3%A1%21+Vim+pelo+site+da+ST+Eletr%C3%B4nicos',
    'email','contato@alojast.com'
  )),
  ('faq', jsonb_build_array(
    jsonb_build_object('q','Quais formas de pagamento?','a','Pix, cartão de crédito/débito (Visa, Master) e dinheiro na entrega.'),
    jsonb_build_object('q','Quanto tempo demora a entrega?','a','Pedidos confirmados são enviados por motoboy no mesmo dia em horário comercial.'),
    jsonb_build_object('q','Posso trocar um produto?','a','Sim, você tem até 7 dias para solicitar troca direto da sua conta.')
  )),
  ('footer', jsonb_build_object(
    'tagline','Loja oficial @alojast. Eletrônicos, camisas e variedades.',
    'copyright','© 2026 A Loja ST. Todos os direitos reservados.'
  ))
ON CONFLICT (key) DO NOTHING;
