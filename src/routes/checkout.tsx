import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/productAssets";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout — A Loja ST" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const nav = useNavigate();
  const { items, total, clear } = useCart();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", phone: "", email: "",
    street: "", number: "", complement: "", neighborhood: "", city: "", zip: "",
    payment: "pix" as "pix" | "card" | "cash",
    notes: "",
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, email: f.email || user.email || "" }));
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle()
        .then(({ data }) => {
          if (data) setForm((f) => ({ ...f, name: f.name || data.full_name || "", phone: f.phone || data.phone || "" }));
        });
    }
  }, [user]);

  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-5 py-16 text-center">
          <h1 className="display text-4xl">Entre para finalizar</h1>
          <p className="mt-4 text-muted-foreground">Você precisa estar logado para concluir o pedido.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/login" className="rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground">Entrar</Link>
            <Link to="/cadastro" className="rounded-sm border border-border px-6 py-3 text-sm font-bold uppercase tracking-wider hover:border-primary">Criar conta</Link>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0 && !submitting) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-5 py-16 text-center">
          <h1 className="display text-4xl">Sacola vazia</h1>
          <Link to="/" className="mt-6 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground">Voltar à loja</Link>
        </main>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      address: {
        street: form.street, number: form.number, complement: form.complement,
        neighborhood: form.neighborhood, city: form.city, zip: form.zip,
      },
      subtotal_cents: total,
      shipping_cents: 0,
      total_cents: total,
      payment_method: form.payment,
      notes: form.notes,
      status: "pending",
    }).select("id").single();

    if (error || !order) {
      setSubmitting(false);
      toast.error("Erro ao criar pedido: " + (error?.message ?? ""));
      return;
    }
    const { error: itemsErr } = await supabase.from("order_items").insert(
      items.map((i) => ({
        order_id: order.id,
        product_id: i.productId,
        variant_id: i.variantId ?? null,
        product_name: i.name,
        variant_name: i.variantName ?? null,
        quantity: i.quantity,
        unit_price_cents: i.unitPrice,
      })),
    );
    if (itemsErr) {
      setSubmitting(false);
      toast.error("Erro ao gravar itens: " + itemsErr.message);
      return;
    }
    clear();
    toast.success("Pedido recebido! Em breve entraremos em contato.");
    nav({ to: "/minha-conta" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <h1 className="display text-5xl">Checkout</h1>
        <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <Section title="Seus dados">
              <Grid>
                <Field label="Nome completo" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                <Field label="Telefone / WhatsApp" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required />
                <Field label="E-mail" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
              </Grid>
            </Section>

            <Section title="Endereço de entrega">
              <Grid>
                <Field label="Rua" value={form.street} onChange={(v) => setForm({ ...form, street: v })} required />
                <Field label="Número" value={form.number} onChange={(v) => setForm({ ...form, number: v })} required />
                <Field label="Complemento" value={form.complement} onChange={(v) => setForm({ ...form, complement: v })} />
                <Field label="Bairro" value={form.neighborhood} onChange={(v) => setForm({ ...form, neighborhood: v })} required />
                <Field label="Cidade" value={form.city} onChange={(v) => setForm({ ...form, city: v })} required />
                <Field label="CEP" value={form.zip} onChange={(v) => setForm({ ...form, zip: v })} required />
              </Grid>
            </Section>

            <Section title="Pagamento">
              <div className="grid gap-2 sm:grid-cols-3">
                {(["pix", "card", "cash"] as const).map((p) => (
                  <label key={p} className={`flex cursor-pointer items-center justify-center gap-2 rounded-sm border px-4 py-3 text-sm font-bold uppercase tracking-wider ${form.payment === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-surface"}`}>
                    <input type="radio" name="pay" checked={form.payment === p} onChange={() => setForm({ ...form, payment: p })} className="sr-only" />
                    {p === "pix" ? "Pix" : p === "card" ? "Cartão" : "Dinheiro"}
                  </label>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Após confirmar, entraremos em contato pelo WhatsApp para combinar o pagamento e a entrega.</p>
            </Section>

            <Section title="Observações (opcional)">
              <textarea
                value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                className="w-full rounded-sm border border-border bg-surface px-4 py-3"
                placeholder="Ponto de referência, horário preferido..."
              />
            </Section>
          </div>

          <aside className="h-fit space-y-4 rounded-sm border border-border bg-surface p-6 lg:sticky lg:top-24">
            <h2 className="display text-2xl">Resumo</h2>
            <ul className="space-y-3 border-y border-border py-4">
              {items.map((i, idx) => (
                <li key={idx} className="flex gap-3 text-sm">
                  <img src={i.image} alt={i.name} className="h-12 w-12 rounded-sm bg-white object-cover" />
                  <div className="flex-1">
                    <div className="font-medium">{i.name}</div>
                    {i.variantName && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{i.variantName}</div>}
                    <div className="text-xs text-muted-foreground">{i.quantity}x {formatBRL(i.unitPrice)}</div>
                  </div>
                  <div className="font-bold">{formatBRL(i.unitPrice * i.quantity)}</div>
                </li>
              ))}
            </ul>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
            <button disabled={submitting} className="w-full rounded-sm bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60">
              {submitting ? "Enviando..." : "Confirmar pedido"}
            </button>
          </aside>
        </form>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-border bg-surface p-6">
      <h2 className="display text-2xl">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}
function Field({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-4 py-3" />
    </label>
  );
}
