import { Link } from "@tanstack/react-router";
import { productImage, formatBRL } from "@/lib/productAssets";

export type ProductCardData = {
  slug: string;
  name: string;
  brand: string | null;
  price_cents: number;
  sale_price_cents: number | null;
  image_url: string;
  stock: number;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const hasSale = p.sale_price_cents != null && p.sale_price_cents < p.price_cents;
  const finalPrice = hasSale ? p.sale_price_cents! : p.price_cents;
  const discount = hasSale ? Math.round(((p.price_cents - p.sale_price_cents!) / p.price_cents) * 100) : 0;
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-sm border border-border bg-surface transition hover:border-primary"
    >
      <div className="relative aspect-square overflow-hidden bg-white">
        <img
          src={productImage(p.image_url)}
          alt={p.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {hasSale && (
          <span className="absolute left-3 top-3 rounded-sm bg-destructive px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive-foreground">
            -{discount}%
          </span>
        )}
        {p.stock === 0 && (
          <span className="absolute right-3 top-3 rounded-sm bg-foreground/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-background">
            Esgotado
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {p.brand && (
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{p.brand}</div>
        )}
        <div className="text-sm font-semibold leading-tight">{p.name}</div>
        <div className="mt-auto flex items-baseline gap-2">
          {hasSale && (
            <span className="text-xs text-muted-foreground line-through">{formatBRL(p.price_cents)}</span>
          )}
          <span className="text-lg font-bold text-primary">{formatBRL(finalPrice)}</span>
        </div>
      </div>
    </Link>
  );
}
