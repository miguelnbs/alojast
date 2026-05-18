import { Link } from "@tanstack/react-router";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart, itemKey } from "@/lib/cart";
import { formatBRL } from "@/lib/productAssets";

export function CartDrawer() {
  const { items, total, open, setOpen, remove, setQty } = useCart();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-background/70 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={`fixed right-0 top-0 z-[101] flex h-full w-full max-w-md flex-col border-l border-border bg-background transition-transform duration-300 ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <span className="display text-xl">Sua sacola</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <ShoppingBag className="mx-auto h-10 w-10 opacity-40" />
              <p className="mt-4 text-sm">Sua sacola está vazia</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((i) => {
                const k = itemKey(i);
                return (
                  <li key={k} className="flex gap-3 border-b border-border pb-4">
                    <img src={i.image} alt={i.name} className="h-20 w-20 rounded-sm bg-white object-cover" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{i.name}</div>
                      {i.variantName && (
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{i.variantName}</div>
                      )}
                      <div className="mt-1 text-sm font-bold text-primary">{formatBRL(i.unitPrice)}</div>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => setQty(k, i.quantity - 1)}
                          className="grid h-7 w-7 place-items-center rounded-sm border border-border"
                          aria-label="Diminuir"
                        ><Minus className="h-3 w-3" /></button>
                        <span className="min-w-6 text-center text-sm">{i.quantity}</span>
                        <button
                          onClick={() => setQty(k, i.quantity + 1)}
                          className="grid h-7 w-7 place-items-center rounded-sm border border-border"
                          aria-label="Aumentar"
                        ><Plus className="h-3 w-3" /></button>
                        <button
                          onClick={() => remove(k)}
                          className="ml-auto text-muted-foreground hover:text-destructive"
                          aria-label="Remover"
                        ><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <footer className="border-t border-border px-5 py-4">
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-wider text-muted-foreground">Subtotal</span>
              <span className="text-lg font-bold text-primary">{formatBRL(total)}</span>
            </div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="mt-4 block w-full rounded-sm bg-primary py-4 text-center text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110"
            >
              Finalizar pedido
            </Link>
            <Link
              to="/carrinho"
              onClick={() => setOpen(false)}
              className="mt-2 block w-full rounded-sm border border-border py-3 text-center text-xs font-bold uppercase tracking-wider hover:border-primary"
            >
              Ver sacola completa
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}

export function CartButton({ className = "" }: { className?: string }) {
  const { count, setOpen } = useCart();
  return (
    <button
      onClick={() => setOpen(true)}
      className={`relative inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-4 py-2 text-sm font-bold uppercase tracking-wider hover:border-primary ${className}`}
      aria-label="Abrir sacola"
    >
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Sacola</span>
      {count > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
          {count}
        </span>
      )}
    </button>
  );
}
