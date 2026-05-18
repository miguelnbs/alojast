import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, productImage } from "@/lib/productAssets";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

function AdminProducts() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price_cents, sale_price_cents, stock, active, image_url, brand, category_id, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateField = async (id: string, field: string, value: any) => {
    const { error } = await (supabase.from("products").update as any)({ [field]: value }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Atualizado");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="display text-4xl">Produtos</h1>
        <span className="text-xs text-muted-foreground">{products?.length ?? 0} produtos</span>
      </div>
      <div className="mt-6 overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left">
              <th className="px-3 py-2">Produto</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Preço</th>
              <th className="px-3 py-2">Promo</th>
              <th className="px-3 py-2">Estoque</th>
              <th className="px-3 py-2">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((p: any) => (
              <tr key={p.id} className="border-t border-border align-middle">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img src={productImage(p.image_url)} alt="" className="h-10 w-10 rounded-sm bg-white object-cover" />
                    <div>
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{p.brand}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">{p.categories?.name}</td>
                <td className="px-3 py-2">
                  <EditableCents value={p.price_cents} onSave={(v) => updateField(p.id, "price_cents", v)} />
                </td>
                <td className="px-3 py-2">
                  <EditableCents value={p.sale_price_cents} nullable onSave={(v) => updateField(p.id, "sale_price_cents", v)} />
                </td>
                <td className="px-3 py-2">
                  <EditableNum value={p.stock} onSave={(v) => updateField(p.id, "stock", v)} />
                </td>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={p.active} onChange={(e) => updateField(p.id, "active", e.target.checked)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Clique nos valores de preço, promoção ou estoque para editar.</p>
    </div>
  );
}

function EditableNum({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <input
      type="number" value={v} onChange={(e) => setV(e.target.value)}
      onBlur={() => { if (Number(v) !== value) onSave(Number(v)); }}
      className="w-20 rounded-sm border border-border bg-background px-2 py-1"
    />
  );
}
function EditableCents({ value, nullable, onSave }: { value: number | null; nullable?: boolean; onSave: (v: number | null) => void }) {
  const [v, setV] = useState(value == null ? "" : (value / 100).toFixed(2));
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">R$</span>
      <input
        type="number" step="0.01" value={v} onChange={(e) => setV(e.target.value)}
        onBlur={() => {
          if (v === "" && nullable) { if (value != null) onSave(null); return; }
          const cents = Math.round(Number(v) * 100);
          if (cents !== value) onSave(cents);
        }}
        placeholder={nullable ? "—" : ""}
        className="w-24 rounded-sm border border-border bg-background px-2 py-1"
      />
      {value != null && <span className="text-xs text-muted-foreground">{formatBRL(value)}</span>}
    </div>
  );
}
