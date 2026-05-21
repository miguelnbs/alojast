import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/productAssets";

export const Route = createFileRoute("/admin/pedidos")({
  component: AdminOrders,
});

const STATUSES = ["pending", "paid", "shipped", "delivered", "cancelled"] as const;
type OrderStatus = (typeof STATUSES)[number];

type OrderItemRow = {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price_cents: number;
};

type OrderAddress = {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  zip?: string;
};

type OrderRow = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  payment_method: string | null;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  notes: string | null;
  address: OrderAddress | null;
  order_items: OrderItemRow[];
};

function AdminOrders() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderRow[];
    },
  });

  const setStatus = async (id: string, status: OrderStatus) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const deleteOrder = async (order: OrderRow) => {
    const shouldRestore =
      order.status === "paid" || order.status === "shipped" || order.status === "delivered";
    const confirmed = window.confirm(
      `Excluir definitivamente o pedido #${order.id.slice(0, 8)}?\n\nOs itens serão removidos junto com o pedido.${
        shouldRestore
          ? "\nComo o pedido já saiu do status pendente, o estoque será restaurado automaticamente."
          : ""
      }`,
    );
    if (!confirmed) return;

    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    if (error) return toast.error(error.message);

    toast.success("Pedido excluído");
    setExpanded((current) => (current === order.id ? null : current));
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
    qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["category"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const filtered = (orders ?? []).filter((o) => filter === "all" || o.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-4xl">Pedidos</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-sm border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">Todos</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((o) => (
          <article key={o.id} className="rounded-sm border border-border bg-surface">
            <header className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="text-sm font-bold">
                  #{o.id.slice(0, 8)} — {o.customer_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(o.created_at).toLocaleString("pt-BR")} · {o.customer_phone} ·{" "}
                  {o.payment_method}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-bold text-primary">{formatBRL(o.total_cents)}</span>
                <select
                  value={o.status}
                  onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                  className="rounded-sm border border-border bg-background px-2 py-1 text-xs uppercase tracking-wider"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary"
                >
                  {expanded === o.id ? "Fechar" : "Detalhes"}
                </button>
                <button
                  onClick={() => deleteOrder(o)}
                  className="inline-flex items-center gap-1 rounded-sm border border-destructive/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </header>
            {expanded === o.id && (
              <div className="grid gap-4 border-t border-border p-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Itens</h3>
                  <ul className="mt-2 space-y-1 text-sm">
                    {o.order_items.map((it) => (
                      <li key={it.id} className="flex justify-between">
                        <span>
                          {it.quantity}x {it.product_name}{" "}
                          {it.variant_name && `(${it.variant_name})`}
                        </span>
                        <span>{formatBRL(it.unit_price_cents * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
                    Endereço & contato
                  </h3>
                  <p className="mt-2 text-sm">{o.customer_email}</p>
                  <p className="text-sm text-muted-foreground">
                    {o.address?.street}, {o.address?.number} {o.address?.complement} —{" "}
                    {o.address?.neighborhood}, {o.address?.city} · CEP {o.address?.zip}
                  </p>
                  {o.notes && (
                    <p className="mt-2 text-xs italic text-muted-foreground">Obs: {o.notes}</p>
                  )}
                </div>
              </div>
            )}
          </article>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-sm border border-border bg-surface p-10 text-center text-muted-foreground">
            Nenhum pedido.
          </div>
        )}
      </div>
    </div>
  );
}
