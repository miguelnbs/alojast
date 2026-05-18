import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/productAssets";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const [orders, products, exchanges] = await Promise.all([
        supabase.from("orders").select("id, status, total_cents, created_at"),
        supabase.from("products").select("id, name, stock, active"),
        supabase.from("exchange_requests").select("id, status"),
      ]);
      return {
        orders: orders.data ?? [],
        products: products.data ?? [],
        exchanges: exchanges.data ?? [],
      };
    },
  });

  if (!data) return <div className="text-muted-foreground">Carregando...</div>;

  const totalRevenue = data.orders.filter((o) => o.status === "paid" || o.status === "delivered" || o.status === "shipped").reduce((a, b) => a + b.total_cents, 0);
  const pendingOrders = data.orders.filter((o) => o.status === "pending").length;
  const lowStock = data.products.filter((p) => p.stock <= 5 && p.active).length;
  const pendingExchanges = data.exchanges.filter((e) => e.status === "pending").length;

  const cards = [
    { label: "Receita confirmada", value: formatBRL(totalRevenue) },
    { label: "Pedidos pendentes", value: pendingOrders },
    { label: "Produtos com estoque baixo", value: lowStock },
    { label: "Trocas pendentes", value: pendingExchanges },
  ];

  return (
    <div>
      <h1 className="display text-4xl">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-sm border border-border bg-surface p-5">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
            <div className="mt-2 display text-3xl text-primary">{c.value}</div>
          </div>
        ))}
      </div>

      <h2 className="display mt-12 text-2xl">Últimos pedidos</h2>
      <div className="mt-4 overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left">
              <th className="px-4 py-2">Pedido</th>
              <th className="px-4 py-2">Data</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.slice(0, 10).map((o) => (
              <tr key={o.id} className="border-t border-border">
                <td className="px-4 py-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-2">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-2">{o.status}</td>
                <td className="px-4 py-2 text-right font-bold">{formatBRL(o.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
