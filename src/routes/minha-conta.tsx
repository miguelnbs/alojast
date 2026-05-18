import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Package, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { formatBRL } from "@/lib/productAssets";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({ meta: [{ title: "Minha conta — A Loja ST" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: AccountPage,
});

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  paid: "Pagamento confirmado",
  shipped: "Enviado",
  delivered: "Entregue",
  cancelled: "Cancelado",
};

function AccountPage() {
  const { user, signOut } = useAuth();
  const { data: orders, refetch } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, status, total_cents, payment_method, created_at, order_items(id, product_name, quantity, unit_price_cents)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="display text-5xl">Minha conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <button onClick={signOut} className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary">Sair</button>
        </div>

        <section className="mt-10">
          <h2 className="display text-3xl">Meus pedidos</h2>
          {!orders || orders.length === 0 ? (
            <div className="mt-6 rounded-sm border border-border bg-surface p-10 text-center text-muted-foreground">
              Você ainda não fez nenhum pedido. <Link to="/" className="text-primary underline">Ver loja</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((o: any) => <OrderCard key={o.id} order={o} onChanged={refetch} />)}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function OrderCard({ order, onChanged }: { order: any; onChanged: () => void }) {
  const [openExchange, setOpenExchange] = useState(false);
  const [reason, setReason] = useState("");
  const [itemId, setItemId] = useState<string>(order.order_items[0]?.id ?? "");
  const [sending, setSending] = useState(false);
  const { user } = useAuth();

  const submitExchange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("exchange_requests").insert({
      user_id: user.id, order_id: order.id, order_item_id: itemId, reason,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    toast.success("Solicitação de troca enviada");
    setOpenExchange(false); setReason("");
    onChanged();
  };

  return (
    <article className="rounded-sm border border-border bg-surface p-5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-primary" />
          <div>
            <div className="text-sm font-bold uppercase tracking-wider">Pedido #{order.id.slice(0, 8)}</div>
            <div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("pt-BR")}</div>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${order.status === "paid" || order.status === "delivered" ? "bg-primary text-primary-foreground" : order.status === "cancelled" ? "bg-destructive text-destructive-foreground" : "bg-muted text-foreground"}`}>
          {STATUS_LABEL[order.status]}
        </span>
      </header>

      <ul className="mt-3 space-y-1 text-sm">
        {order.order_items.map((it: any) => (
          <li key={it.id} className="flex justify-between">
            <span>{it.quantity}x {it.product_name}</span>
            <span className="text-muted-foreground">{formatBRL(it.unit_price_cents * it.quantity)}</span>
          </li>
        ))}
      </ul>

      <footer className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <div className="text-sm">
          <span className="text-muted-foreground">Total:</span> <span className="text-lg font-bold text-primary">{formatBRL(order.total_cents)}</span>
        </div>
        {(order.status === "paid" || order.status === "delivered" || order.status === "shipped") && (
          <button onClick={() => setOpenExchange((o) => !o)} className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary">
            <RefreshCw className="h-3 w-3" /> Solicitar troca
          </button>
        )}
      </footer>

      {openExchange && (
        <form onSubmit={submitExchange} className="mt-4 space-y-3 rounded-sm border border-border bg-background p-4">
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">Item</label>
          <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="w-full rounded-sm border border-border bg-surface px-3 py-2">
            {order.order_items.map((it: any) => (
              <option key={it.id} value={it.id}>{it.product_name}</option>
            ))}
          </select>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground">Motivo</label>
          <textarea required value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="w-full rounded-sm border border-border bg-surface px-3 py-2" />
          <button disabled={sending} className="rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-60">
            {sending ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>
      )}
    </article>
  );
}
