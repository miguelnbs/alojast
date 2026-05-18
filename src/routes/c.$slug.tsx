import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import logoSt from "@/assets/logo-st.png";

export const Route = createFileRoute("/c/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${capitalize(params.slug)} — A Loja ST` },
      { name: "description", content: `Confira nossa coleção de ${params.slug} com entrega rápida e preço de loja oficial.` },
    ],
  }),
  component: CategoryPage,
});

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type SortKey = "featured" | "price_asc" | "price_desc" | "name";

function CategoryPage() {
  const { slug } = Route.useParams();
  const [sort, setSort] = useState<SortKey>("featured");
  const [inStockOnly, setInStockOnly] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data: category, error: catErr } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("slug", slug)
        .maybeSingle();
      if (catErr) throw catErr;
      if (!category) throw notFound();
      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("slug, name, brand, price_cents, sale_price_cents, image_url, stock, featured")
        .eq("category_id", category.id)
        .eq("active", true);
      if (prodErr) throw prodErr;
      return { category, products: products ?? [] };
    },
  });

  const products = (data?.products ?? []) as (ProductCardData & { featured: boolean })[];
  const filtered = products
    .filter((p) => (inStockOnly ? p.stock > 0 : true))
    .sort((a, b) => {
      if (sort === "price_asc") return (a.sale_price_cents ?? a.price_cents) - (b.sale_price_cents ?? b.price_cents);
      if (sort === "price_desc") return (b.sale_price_cents ?? b.price_cents) - (a.sale_price_cents ?? a.price_cents);
      if (sort === "name") return a.name.localeCompare(b.name);
      return Number(b.featured) - Number(a.featured);
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SimpleHeader />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3 w-3" /> Voltar
        </Link>
        <h1 className="display mt-4 text-5xl md:text-6xl">
          {data?.category.name ?? capitalize(slug)}
        </h1>
        {data?.category.description && (
          <p className="mt-2 max-w-2xl text-muted-foreground">{data.category.description}</p>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-3 border-y border-border py-4">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">
            {filtered.length} produto{filtered.length === 1 ? "" : "s"}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs uppercase tracking-wider">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
              Em estoque
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="rounded-sm border border-border bg-surface px-3 py-2 text-xs uppercase tracking-wider"
            >
              <option value="featured">Destaques</option>
              <option value="price_asc">Menor preço</option>
              <option value="price_desc">Maior preço</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>
        </div>

        {isLoading && <div className="py-20 text-center text-muted-foreground">Carregando produtos...</div>}
        {error && <div className="py-20 text-center text-destructive">Categoria não encontrada.</div>}

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => <ProductCard key={p.slug} p={p} />)}
        </div>
      </main>
    </div>
  );
}

function SimpleHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoSt} alt="Logo Loja ST" className="h-10 w-10 object-contain" />
          <div className="leading-none">
            <div className="display text-xl">A LOJA ST</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">since 2018</div>
          </div>
        </Link>
        <a
          href="https://wa.me/?text=Ol%C3%A1%21+Vim+pelo+site+da+ST+Eletr%C3%B4nicos"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-sm font-bold uppercase tracking-wider text-primary-foreground"
        >
          <MessageCircle className="h-4 w-4" /> Pedir agora
        </a>
      </div>
    </header>
  );
}
