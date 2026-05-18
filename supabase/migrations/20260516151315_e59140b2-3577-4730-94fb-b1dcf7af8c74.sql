
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'customer');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'shipped', 'delivered', 'cancelled');
CREATE TYPE public.exchange_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (separate table, security best practice)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- has_role security-definer function
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  brand TEXT,
  price_cents INT NOT NULL CHECK (price_cents >= 0),
  sale_price_cents INT CHECK (sale_price_cents IS NULL OR sale_price_cents >= 0),
  image_url TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  featured BOOLEAN NOT NULL DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_active ON public.products(active);

-- Variants
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_variants_product ON public.product_variants(product_id);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  address JSONB NOT NULL DEFAULT '{}',
  subtotal_cents INT NOT NULL DEFAULT 0,
  shipping_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  payment_method TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cents INT NOT NULL CHECK (unit_price_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);

-- Exchange requests
CREATE TABLE public.exchange_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES public.order_items(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  new_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  status public.exchange_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_exchanges_user ON public.exchange_requests(user_id);
CREATE INDEX idx_exchanges_order ON public.exchange_requests(order_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_exchanges_updated BEFORE UPDATE ON public.exchange_requests FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Stock automation on order status change
CREATE OR REPLACE FUNCTION public.handle_order_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item RECORD;
BEGIN
  -- Going to paid: decrement
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') THEN
    FOR item IN SELECT product_id, variant_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
      UPDATE public.products SET stock = GREATEST(stock - item.quantity, 0) WHERE id = item.product_id;
      IF item.variant_id IS NOT NULL THEN
        UPDATE public.product_variants SET stock = GREATEST(stock - item.quantity, 0) WHERE id = item.variant_id;
      END IF;
    END LOOP;
  END IF;
  -- Cancelling a previously paid order: restore stock
  IF NEW.status = 'cancelled' AND OLD.status IN ('paid','shipped','delivered') THEN
    FOR item IN SELECT product_id, variant_id, quantity FROM public.order_items WHERE order_id = NEW.id LOOP
      UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
      IF item.variant_id IS NOT NULL THEN
        UPDATE public.product_variants SET stock = stock + item.quantity WHERE id = item.variant_id;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_orders_stock AFTER UPDATE OF status ON public.orders FOR EACH ROW EXECUTE FUNCTION public.handle_order_stock();

-- Exchange approval -> stock adjustment
CREATE OR REPLACE FUNCTION public.handle_exchange_stock()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE item RECORD;
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    IF NEW.order_item_id IS NOT NULL THEN
      SELECT product_id, quantity INTO item FROM public.order_items WHERE id = NEW.order_item_id;
      IF FOUND THEN
        UPDATE public.products SET stock = stock + item.quantity WHERE id = item.product_id;
      END IF;
    END IF;
    IF NEW.new_product_id IS NOT NULL THEN
      UPDATE public.products SET stock = GREATEST(stock - 1, 0) WHERE id = NEW.new_product_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_exchanges_stock AFTER UPDATE OF status ON public.exchange_requests FOR EACH ROW EXECUTE FUNCTION public.handle_exchange_stock();

-- New user: profile + customer role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
    ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS enable
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;

-- Policies: profiles
CREATE POLICY "Profiles select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Policies: user_roles (read own; admins manage)
CREATE POLICY "Roles read own" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Roles admin manage" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: categories (public read, admin write)
CREATE POLICY "Categories public read" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Categories admin write" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: products (public read active, admin all)
CREATE POLICY "Products public read active" ON public.products FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Products admin write" ON public.products FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: variants
CREATE POLICY "Variants public read" ON public.product_variants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Variants admin write" ON public.product_variants FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: orders
CREATE POLICY "Orders select own or admin" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Orders insert own" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Orders admin update" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Policies: order_items (via parent order ownership)
CREATE POLICY "Order items select" ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "Order items insert own" ON public.order_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- Policies: exchanges
CREATE POLICY "Exchanges select own or admin" ON public.exchange_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Exchanges insert own" ON public.exchange_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Exchanges admin update" ON public.exchange_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
