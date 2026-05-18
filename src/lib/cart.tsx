import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number; // cents
  quantity: number;
  variantId?: string | null;
  variantName?: string | null;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (item: CartItem) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
};

const itemKey = (i: Pick<CartItem, "productId" | "variantId">) =>
  `${i.productId}::${i.variantId ?? "_"}`;

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "st_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE, JSON.stringify(items)); } catch {}
  }, [items]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const k = itemKey(item);
      const idx = prev.findIndex((p) => itemKey(p) === k);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + item.quantity };
        return copy;
      }
      return [...prev, item];
    });
    setOpen(true);
  }, []);

  const remove = useCallback((key: string) => {
    setItems((prev) => prev.filter((p) => itemKey(p) !== key));
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((p) => (itemKey(p) === key ? { ...p, quantity: Math.max(0, qty) } : p))
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const count = items.reduce((a, b) => a + b.quantity, 0);
  const total = items.reduce((a, b) => a + b.quantity * b.unitPrice, 0);

  return (
    <Ctx.Provider value={{ items, count, total, open, setOpen, add, remove, setQty, clear }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart fora do CartProvider");
  return c;
}

export { itemKey };
