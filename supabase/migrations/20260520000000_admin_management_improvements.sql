-- Admin management improvements:
-- - admin can delete test/duplicate orders
-- - stock is restored automatically when a paid/shipped/delivered order is deleted
-- - admin can upload product and site/category images through public storage buckets
-- - default visual settings are available for the admin visual editor

DROP POLICY IF EXISTS "Orders admin delete" ON public.orders;
CREATE POLICY "Orders admin delete"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Order items admin delete" ON public.order_items;
CREATE POLICY "Order items admin delete"
  ON public.order_items
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Exchanges admin delete" ON public.exchange_requests;
CREATE POLICY "Exchanges admin delete"
  ON public.exchange_requests
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.restore_order_stock_before_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  IF OLD.status IN ('paid', 'shipped', 'delivered') THEN
    FOR item IN
      SELECT product_id, variant_id, quantity
      FROM public.order_items
      WHERE order_id = OLD.id
    LOOP
      UPDATE public.products
      SET stock = stock + item.quantity
      WHERE id = item.product_id;

      IF item.variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock + item.quantity
        WHERE id = item.variant_id;
      END IF;
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_restore_stock_before_delete ON public.orders;
CREATE TRIGGER trg_orders_restore_stock_before_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.restore_order_stock_before_delete();

REVOKE EXECUTE ON FUNCTION public.restore_order_stock_before_delete() FROM PUBLIC, anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'site-assets',
    'site-assets',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Product images public read" ON storage.objects;
CREATE POLICY "Product images public read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Product images admin insert" ON storage.objects;
CREATE POLICY "Product images admin insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Product images admin update" ON storage.objects;
CREATE POLICY "Product images admin update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Product images admin delete" ON storage.objects;
CREATE POLICY "Product images admin delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Site assets public read" ON storage.objects;
CREATE POLICY "Site assets public read"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Site assets admin insert" ON storage.objects;
CREATE POLICY "Site assets admin insert"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Site assets admin update" ON storage.objects;
CREATE POLICY "Site assets admin update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Site assets admin delete" ON storage.objects;
CREATE POLICY "Site assets admin delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'site-assets' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_settings (key, value) VALUES
  ('visual', '{
    "primary_color": "#f7c600",
    "primary_foreground_color": "#070707",
    "background_color": "#070707",
    "surface_color": "#151515",
    "surface_2_color": "#202020",
    "text_color": "#fafafa",
    "muted_text_color": "#a3a3a3",
    "border_color": "#303030",
    "logo_title": "A LOJA ST",
    "logo_subtitle": "SINCE 2018",
    "logo_url": "",
    "hero_image_url": ""
  }'::jsonb)
ON CONFLICT (key) DO NOTHING;
