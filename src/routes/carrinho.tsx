import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCart, itemKey } from "@/lib/cart";
import { formatBRL } from "@/lib/productAssets";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Sacola — A Loja ST" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, total, remove, setQty } = useCart();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <h1 className="display text-5xl">Sua sacola</h1>
        {items.length === 0 ? (
          <div className="mt-12 rounded-sm border border-border bg-surface p-12 text-center">
            <p className="text-muted-foreground">Sacola vazia.</p>
            <Link to="/" className="mt-6 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground">
              Voltar à loja
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
            <ul className="space-y-4">
              {items.map((i) => {
                const k = itemKey(i);
                return (
                  <li key={k} className="flex gap-4 rounded-sm border border-border bg-surface p-4">
                    <img src={i.image} alt={i.name} className="h-24 w-24 rounded-sm bg-white object-cover" />
                    <div className="flex-1">
                      <div className="font-semibold">{i.name}</div>
                      {i.variantName && <div className="text-xs text-muted-foreground uppercase tracking-wider">{i.variantName}</div>}
                      <div className="mt-1 text-primary font-bold">{formatBRL(i.unitPrice)}</div>
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => setQty(k, i.quantity - 1)} className="grid h-8 w-8 place-items-center rounded-sm border border-border"><Minus className="h-3 w-3" /></button>
                        <span className="min-w-8 text-center">{i.quantity}</span>
                        <button onClick={() => setQty(k, i.quantity + 1)} className="grid h-8 w-8 place-items-center rounded-sm border border-border"><Plus className="h-3 w-3" /></button>
                        <button onClick={() => remove(k)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="text-right font-bold">{formatBRL(i.unitPrice * i.quantity)}</div>
                  </li>
                );
              })}
            </ul>
            <aside className="rounded-sm border border-border bg-surface p-6 h-fit sticky top-24">
              <h2 className="display text-2xl">Resumo</h2>
              <div className="mt-4 flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatBRL(total)}</span>
              </div>
              <div className="mt-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Frete</span>
                <span className="text-muted-foreground">Combinado</span>
              </div>
              <div className="mt-4 flex justify-between border-t border-border pt-4 text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatBRL(total)}</span>
              </div>
              <Link to="/checkout" className="mt-6 block w-full rounded-sm bg-primary py-4 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110">
                Finalizar pedido
              </Link>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}
