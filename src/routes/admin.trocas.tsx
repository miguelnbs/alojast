import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/trocas")({
  component: AdminExchanges,
});

function AdminExchanges() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-exchanges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exchange_requests")
        .select("*, orders(customer_name, customer_email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const setStatus = async (id: string, status: "approved" | "rejected" | "completed" | "pending") => {
    const { error } = await supabase.from("exchange_requests").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Troca atualizada");
    qc.invalidateQueries({ queryKey: ["admin-exchanges"] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <h1 className="display text-4xl">Trocas</h1>
      <div className="mt-6 space-y-3">
        {(data ?? []).map((e: any) => (
          <article key={e.id} className="rounded-sm border border-border bg-surface p-4">
            <header className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold">#{e.id.slice(0, 8)} — {e.orders?.customer_name}</div>
                <div className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString("pt-BR")} · {e.orders?.customer_email}</div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${e.status === "approved" ? "bg-primary text-primary-foreground" : e.status === "rejected" ? "bg-destructive text-destructive-foreground" : "bg-muted"}`}>
                {e.status}
              </span>
            </header>
            <p className="mt-3 text-sm">{e.reason}</p>
            {e.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => setStatus(e.id, "approved")} className="rounded-sm bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground">Aprovar</button>
                <button onClick={() => setStatus(e.id, "rejected")} className="rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-destructive">Rejeitar</button>
              </div>
            )}
          </article>
        ))}
        {(!data || data.length === 0) && <div className="rounded-sm border border-border bg-surface p-10 text-center text-muted-foreground">Nenhuma solicitação.</div>}
      </div>
    </div>
  );
}
