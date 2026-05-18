import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULTS, type SiteSettings } from "@/lib/siteSettings";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/admin/site")({
  component: AdminSite,
});

function AdminSite() {
  const qc = useQueryClient();
  const { data: initial } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, any> = {};
      (data ?? []).forEach((r: any) => { map[r.key] = r.value; });
      return {
        hero: { ...DEFAULTS.hero, ...(map.hero ?? {}) },
        stats: Array.isArray(map.stats) ? map.stats : DEFAULTS.stats,
        marquee: Array.isArray(map.marquee) ? map.marquee : DEFAULTS.marquee,
        contact: { ...DEFAULTS.contact, ...(map.contact ?? {}) },
        faq: Array.isArray(map.faq) ? map.faq : DEFAULTS.faq,
        footer: { ...DEFAULTS.footer, ...(map.footer ?? {}) },
      } as SiteSettings;
    },
  });

  const [s, setS] = useState<SiteSettings | null>(null);
  useEffect(() => { if (initial) setS(initial); }, [initial]);

  if (!s) return <div className="text-muted-foreground">Carregando...</div>;

  const save = async (key: keyof SiteSettings, value: any) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) return toast.error(error.message);
    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display text-4xl">Editar site</h1>
        <p className="mt-2 text-sm text-muted-foreground">Mude textos da home em tempo real. Tudo aqui é salvo no banco e aplicado para todos os visitantes.</p>
      </header>

      {/* HERO */}
      <Card title="Hero (topo da home)">
        <Row><Field label="Selo" value={s.hero.badge} onChange={(v) => setS({ ...s, hero: { ...s.hero, badge: v } })} /></Row>
        <Row>
          <Field label="Título — linha 1" value={s.hero.title_line1} onChange={(v) => setS({ ...s, hero: { ...s.hero, title_line1: v } })} />
          <Field label="Título — linha 2" value={s.hero.title_line2} onChange={(v) => setS({ ...s, hero: { ...s.hero, title_line2: v } })} />
        </Row>
        <Area label="Subtítulo" value={s.hero.subtitle} onChange={(v) => setS({ ...s, hero: { ...s.hero, subtitle: v } })} />
        <Row>
          <Field label="CTA primário" value={s.hero.cta_primary} onChange={(v) => setS({ ...s, hero: { ...s.hero, cta_primary: v } })} />
          <Field label="CTA secundário" value={s.hero.cta_secondary} onChange={(v) => setS({ ...s, hero: { ...s.hero, cta_secondary: v } })} />
        </Row>
        <SaveBtn onClick={() => save("hero", s.hero)} />
      </Card>

      {/* STATS */}
      <Card title="Estatísticas (3 cards)">
        {s.stats.map((stat, i) => (
          <Row key={i}>
            <Field label={`Valor ${i + 1}`} value={stat.k} onChange={(v) => {
              const copy = [...s.stats]; copy[i] = { ...copy[i], k: v }; setS({ ...s, stats: copy });
            }} />
            <Field label={`Rótulo ${i + 1}`} value={stat.v} onChange={(v) => {
              const copy = [...s.stats]; copy[i] = { ...copy[i], v }; setS({ ...s, stats: copy });
            }} />
          </Row>
        ))}
        <SaveBtn onClick={() => save("stats", s.stats)} />
      </Card>

      {/* MARQUEE */}
      <Card title="Marquee (faixa animada)">
        <Area
          label="Itens (um por linha)"
          value={s.marquee.join("\n")}
          onChange={(v) => setS({ ...s, marquee: v.split("\n").map((l) => l.trim()).filter(Boolean) })}
          rows={6}
        />
        <SaveBtn onClick={() => save("marquee", s.marquee)} />
      </Card>

      {/* CONTACT */}
      <Card title="Contato">
        <Field label="Instagram URL" value={s.contact.instagram} onChange={(v) => setS({ ...s, contact: { ...s.contact, instagram: v } })} />
        <Field label="WhatsApp URL" value={s.contact.whatsapp} onChange={(v) => setS({ ...s, contact: { ...s.contact, whatsapp: v } })} />
        <Field label="E-mail" value={s.contact.email} onChange={(v) => setS({ ...s, contact: { ...s.contact, email: v } })} />
        <SaveBtn onClick={() => save("contact", s.contact)} />
      </Card>

      {/* FAQ */}
      <Card title="FAQ">
        {s.faq.map((item, i) => (
          <div key={i} className="rounded-sm border border-border p-3">
            <Field label={`Pergunta ${i + 1}`} value={item.q} onChange={(v) => {
              const copy = [...s.faq]; copy[i] = { ...copy[i], q: v }; setS({ ...s, faq: copy });
            }} />
            <Area label="Resposta" value={item.a} onChange={(v) => {
              const copy = [...s.faq]; copy[i] = { ...copy[i], a: v }; setS({ ...s, faq: copy });
            }} />
            <button onClick={() => setS({ ...s, faq: s.faq.filter((_, idx) => idx !== i) })}
              className="mt-1 text-xs uppercase tracking-wider text-destructive">Remover</button>
          </div>
        ))}
        <button onClick={() => setS({ ...s, faq: [...s.faq, { q: "Nova pergunta", a: "Resposta" }] })}
          className="rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary">+ Adicionar item</button>
        <SaveBtn onClick={() => save("faq", s.faq)} />
      </Card>

      {/* FOOTER */}
      <Card title="Rodapé">
        <Field label="Tagline" value={s.footer.tagline} onChange={(v) => setS({ ...s, footer: { ...s.footer, tagline: v } })} />
        <Field label="Copyright" value={s.footer.copyright} onChange={(v) => setS({ ...s, footer: { ...s.footer, copyright: v } })} />
        <SaveBtn onClick={() => save("footer", s.footer)} />
      </Card>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-sm border border-border bg-surface p-6">
      <h2 className="display text-2xl">{title}</h2>
      {children}
    </section>
  );
}
function Row({ children }: { children: React.ReactNode }) { return <div className="grid gap-3 sm:grid-cols-2">{children}</div>; }
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
}
function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea value={value} rows={rows} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm" />
    </label>
  );
}
function SaveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-sm bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110">
      Salvar bloco
    </button>
  );
}
