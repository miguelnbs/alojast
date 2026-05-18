import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, ShoppingBag, ShieldCheck, Truck, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImage, formatBRL } from "@/lib/productAssets";
import { useCart } from "@/lib/cart";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/produto/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — A Loja ST` },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, slug, name, description, brand, price_cents, sale_price_cents, image_url, stock, category_id")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!product) return null;
      const [{ data: variants }, { data: category }] = await Promise.all([
        supabase.from("product_variants").select("id, name, stock").eq("product_id", product.id),
        supabase.from("categories").select("slug, name").eq("id", product.category_id).maybeSingle(),
      ]);
      return { product, variants: variants ?? [], category };
    },
  });

  if (isLoading) {
    return <div className="min-h-screen bg-background p-10 text-center text-muted-foreground">Carregando...</div>;
  }
  if (!data) {
    return (
      <div className="min-h-screen bg-background p-10 text-center">
        <p>Produto não encontrado.</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Voltar</Link>
      </div>
    );
  }

  const { product, variants, category } = data;
  const hasSale = product.sale_price_cents != null && product.sale_price_cents < product.price_cents;
  const finalPrice = hasSale ? product.sale_price_cents! : product.price_cents;
  const inStock = product.stock > 0;
  

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          {category && (
            <>
              <Link to="/c/$slug" params={{ slug: category.slug }} className="hover:text-primary">{category.name}</Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-sm border border-border bg-white">
            <img
              src={productImage(product.image_url)}
              alt={product.name}
              width={800}
              height={800}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            {product.brand && (
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{product.brand}</div>
            )}
            <h1 className="display mt-2 text-4xl md:text-5xl">{product.name}</h1>
            <div className="mt-4 flex items-baseline gap-3">
              {hasSale && (
                <span className="text-base text-muted-foreground line-through">{formatBRL(product.price_cents)}</span>
              )}
              <span className="text-4xl font-bold text-primary">{formatBRL(finalPrice)}</span>
            </div>
            <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
              ou 3x de {formatBRL(Math.round(finalPrice / 3))} sem juros
            </div>

            {product.description && (
              <p className="mt-6 leading-relaxed text-muted-foreground">{product.description}</p>
            )}

            {variants.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest text-muted-foreground">Tamanho</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      disabled={v.stock === 0}
                      onClick={() => setSelectedVariant(v.name)}
                      className={`rounded-sm border px-4 py-2 text-sm font-semibold uppercase tracking-wider transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedVariant === v.name
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center gap-2 text-sm">
              {inStock ? (
                <><Check className="h-4 w-4 text-primary" /> <span className="text-muted-foreground">Em estoque ({product.stock} unid.)</span></>
              ) : (
                <span className="text-destructive">Esgotado</span>
              )}
            </div>

            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              image={productImage(product.image_url)}
              unitPrice={finalPrice}
              disabled={!inStock || (variants.length > 0 && !selectedVariant)}
              variant={variants.find((v) => v.name === selectedVariant) ?? null}
            />

            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-border pt-6">
              <div className="flex items-center gap-2 text-xs">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Entrega rápida por motoboy</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground">Garantia de 7 dias para troca</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-3 w-3" /> Voltar à loja
          </Link>
        </div>
      </main>
    </div>
  );
}

function AddToCartButton({ productId, slug, name, image, unitPrice, disabled, variant }: {
  productId: string; slug: string; name: string; image: string; unitPrice: number; disabled: boolean;
  variant: { id: string; name: string } | null;
}) {
  const { add } = useCart();
  return (
    <button
      disabled={disabled}
      onClick={() => {
        add({ productId, slug, name, image, unitPrice, quantity: 1, variantId: variant?.id ?? null, variantName: variant?.name ?? null });
        toast.success("Adicionado à sacola");
      }}
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-sm bg-primary px-6 py-4 text-base font-bold uppercase tracking-wider text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <ShoppingBag className="h-5 w-5" /> {disabled && variant === null ? "Selecione um tamanho" : "Adicionar à sacola"}
    </button>
  );
}
