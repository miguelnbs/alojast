import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULTS, type SiteSettings, type VisualSettings } from "@/lib/siteSettings";

export const Route = createFileRoute("/admin/site")({
  component: AdminSite,
});

type VisualAssetField = "logo_url" | "hero_image_url";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uploadSiteAsset(file: File, folder: string) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "asset";
  const path = `${folder}/${Date.now()}-${base}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function AdminSite() {
  const qc = useQueryClient();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [savingVisual, setSavingVisual] = useState(false);

  const { data: initial } = useQuery({
    queryKey: ["admin-site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, unknown> = {};
      (data ?? []).forEach((row) => {
        map[row.key] = row.value;
      });
      return {
        hero: { ...DEFAULTS.hero, ...objectValue(map.hero) },
        stats: Array.isArray(map.stats) ? map.stats : DEFAULTS.stats,
        marquee: Array.isArray(map.marquee) ? map.marquee : DEFAULTS.marquee,
        contact: { ...DEFAULTS.contact, ...objectValue(map.contact) },
        faq: Array.isArray(map.faq) ? map.faq : DEFAULTS.faq,
        footer: { ...DEFAULTS.footer, ...objectValue(map.footer) },
        visual: { ...DEFAULTS.visual, ...objectValue(map.visual) },
      } as SiteSettings;
    },
  });

  const [s, setS] = useState<SiteSettings | null>(null);
  useEffect(() => {
    if (initial) setS(initial);
  }, [initial]);

  if (!s) return <div className="text-muted-foreground">Carregando...</div>;

  const save = async (key: keyof SiteSettings, value: SiteSettings[keyof SiteSettings]) => {
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) {
      toast.error(error.message);
      return false;
    }

    toast.success("Salvo");
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["admin-site-settings"] });
    return true;
  };

  const saveVisual = async () => {
    setSavingVisual(true);
    try {
      const visual = { ...s.visual };
      if (logoFile) visual.logo_url = await uploadSiteAsset(logoFile, "visual");
      if (heroFile) visual.hero_image_url = await uploadSiteAsset(heroFile, "visual");

      const ok = await save("visual", visual);
      if (ok) {
        setS({ ...s, visual });
        setLogoFile(null);
        setHeroFile(null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar visual");
    } finally {
      setSavingVisual(false);
    }
  };

  const setVisual = <K extends keyof VisualSettings>(field: K, value: VisualSettings[K]) => {
    setS({ ...s, visual: { ...s.visual, [field]: value } });
  };

  const setAssetUrl = (field: VisualAssetField, value: string) => {
    setS({ ...s, visual: { ...s.visual, [field]: value } });
  };

  const restoreVisual = async () => {
    setS({ ...s, visual: DEFAULTS.visual });
    setLogoFile(null);
    setHeroFile(null);
    await save("visual", DEFAULTS.visual);
  };

  return (
    <div className="space-y-10">
      <header>
        <h1 className="display text-4xl">Editar site</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Altere textos, cores, logo e imagens principais pelo painel. As mudanças ficam no Supabase
          e aparecem para todos os visitantes.
        </p>
      </header>

      <Card title="Visual global">
        <Row>
          <ColorField
            label="Cor principal"
            value={s.visual.primary_color}
            onChange={(value) => setVisual("primary_color", value)}
          />
          <ColorField
            label="Texto sobre cor principal"
            value={s.visual.primary_foreground_color}
            onChange={(value) => setVisual("primary_foreground_color", value)}
          />
        </Row>
        <Row>
          <ColorField
            label="Fundo"
            value={s.visual.background_color}
            onChange={(value) => setVisual("background_color", value)}
          />
          <ColorField
            label="Texto principal"
            value={s.visual.text_color}
            onChange={(value) => setVisual("text_color", value)}
          />
        </Row>
        <Row>
          <ColorField
            label="Cards / superfícies"
            value={s.visual.surface_color}
            onChange={(value) => setVisual("surface_color", value)}
          />
          <ColorField
            label="Superfície secundária"
            value={s.visual.surface_2_color}
            onChange={(value) => setVisual("surface_2_color", value)}
          />
        </Row>
        <Row>
          <ColorField
            label="Texto secundário"
            value={s.visual.muted_text_color}
            onChange={(value) => setVisual("muted_text_color", value)}
          />
          <ColorField
            label="Bordas"
            value={s.visual.border_color}
            onChange={(value) => setVisual("border_color", value)}
          />
        </Row>
        <Row>
          <Field
            label="Nome no cabeçalho"
            value={s.visual.logo_title}
            onChange={(value) => setVisual("logo_title", value)}
          />
          <Field
            label="Subtítulo no cabeçalho"
            value={s.visual.logo_subtitle}
            onChange={(value) => setVisual("logo_subtitle", value)}
          />
        </Row>
        <div className="grid gap-4 lg:grid-cols-2">
          <AssetField
            label="Logo"
            value={s.visual.logo_url}
            file={logoFile}
            onFile={setLogoFile}
            onChange={(value) => setAssetUrl("logo_url", value)}
            helper="Envie uma imagem ou cole uma URL. Vazio usa a logo padrão do projeto."
          />
          <AssetField
            label="Imagem principal da home"
            value={s.visual.hero_image_url}
            file={heroFile}
            onFile={setHeroFile}
            onChange={(value) => setAssetUrl("hero_image_url", value)}
            helper="Envie uma imagem larga para o topo da página inicial."
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={saveVisual}
            disabled={savingVisual}
            className="rounded-sm bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            {savingVisual ? "Salvando..." : "Salvar visual"}
          </button>
          <button
            onClick={restoreVisual}
            className="rounded-sm border border-border px-5 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary"
          >
            Restaurar visual padrão
          </button>
        </div>
      </Card>

      <Card title="Hero (topo da home)">
        <Row>
          <Field
            label="Selo"
            value={s.hero.badge}
            onChange={(value) => setS({ ...s, hero: { ...s.hero, badge: value } })}
          />
        </Row>
        <Row>
          <Field
            label="Título - linha 1"
            value={s.hero.title_line1}
            onChange={(value) => setS({ ...s, hero: { ...s.hero, title_line1: value } })}
          />
          <Field
            label="Título - linha 2"
            value={s.hero.title_line2}
            onChange={(value) => setS({ ...s, hero: { ...s.hero, title_line2: value } })}
          />
        </Row>
        <Area
          label="Subtítulo"
          value={s.hero.subtitle}
          onChange={(value) => setS({ ...s, hero: { ...s.hero, subtitle: value } })}
        />
        <Row>
          <Field
            label="CTA primário"
            value={s.hero.cta_primary}
            onChange={(value) => setS({ ...s, hero: { ...s.hero, cta_primary: value } })}
          />
          <Field
            label="CTA secundário"
            value={s.hero.cta_secondary}
            onChange={(value) => setS({ ...s, hero: { ...s.hero, cta_secondary: value } })}
          />
        </Row>
        <SaveBtn onClick={() => save("hero", s.hero)} />
      </Card>

      <Card title="Estatísticas (3 cards)">
        {s.stats.map((stat, i) => (
          <Row key={i}>
            <Field
              label={`Valor ${i + 1}`}
              value={stat.k}
              onChange={(value) => {
                const copy = [...s.stats];
                copy[i] = { ...copy[i], k: value };
                setS({ ...s, stats: copy });
              }}
            />
            <Field
              label={`Rótulo ${i + 1}`}
              value={stat.v}
              onChange={(value) => {
                const copy = [...s.stats];
                copy[i] = { ...copy[i], v: value };
                setS({ ...s, stats: copy });
              }}
            />
          </Row>
        ))}
        <SaveBtn onClick={() => save("stats", s.stats)} />
      </Card>

      <Card title="Marquee (faixa animada)">
        <Area
          label="Itens (um por linha)"
          value={s.marquee.join("\n")}
          onChange={(value) =>
            setS({
              ...s,
              marquee: value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
            })
          }
          rows={6}
        />
        <SaveBtn onClick={() => save("marquee", s.marquee)} />
      </Card>

      <Card title="Contato">
        <Field
          label="Instagram URL"
          value={s.contact.instagram}
          onChange={(value) => setS({ ...s, contact: { ...s.contact, instagram: value } })}
        />
        <Field
          label="WhatsApp URL"
          value={s.contact.whatsapp}
          onChange={(value) => setS({ ...s, contact: { ...s.contact, whatsapp: value } })}
        />
        <Field
          label="E-mail"
          value={s.contact.email}
          onChange={(value) => setS({ ...s, contact: { ...s.contact, email: value } })}
        />
        <SaveBtn onClick={() => save("contact", s.contact)} />
      </Card>

      <Card title="FAQ">
        {s.faq.map((item, i) => (
          <div key={i} className="rounded-sm border border-border p-3">
            <Field
              label={`Pergunta ${i + 1}`}
              value={item.q}
              onChange={(value) => {
                const copy = [...s.faq];
                copy[i] = { ...copy[i], q: value };
                setS({ ...s, faq: copy });
              }}
            />
            <Area
              label="Resposta"
              value={item.a}
              onChange={(value) => {
                const copy = [...s.faq];
                copy[i] = { ...copy[i], a: value };
                setS({ ...s, faq: copy });
              }}
            />
            <button
              onClick={() => setS({ ...s, faq: s.faq.filter((_, idx) => idx !== i) })}
              className="mt-1 text-xs uppercase tracking-wider text-destructive"
            >
              Remover
            </button>
          </div>
        ))}
        <button
          onClick={() => setS({ ...s, faq: [...s.faq, { q: "Nova pergunta", a: "Resposta" }] })}
          className="rounded-sm border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary"
        >
          + Adicionar item
        </button>
        <SaveBtn onClick={() => save("faq", s.faq)} />
      </Card>

      <Card title="Rodapé">
        <Field
          label="Tagline"
          value={s.footer.tagline}
          onChange={(value) => setS({ ...s, footer: { ...s.footer, tagline: value } })}
        />
        <Field
          label="Copyright"
          value={s.footer.copyright}
          onChange={(value) => setS({ ...s, footer: { ...s.footer, copyright: value } })}
        />
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

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex gap-2">
        <input
          type="color"
          value={value || "#000000"}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-12 rounded-sm border border-border bg-background p-1"
        />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
    </label>
  );
}

function AssetField({
  label,
  value,
  file,
  onFile,
  onChange,
  helper,
}: {
  label: string;
  value: string;
  file: File | null;
  onFile: (file: File | null) => void;
  onChange: (value: string) => void;
  helper: string;
}) {
  const preview = file ? URL.createObjectURL(file) : value.trim();

  return (
    <div className="rounded-sm border border-border bg-background p-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-3 aspect-video overflow-hidden rounded-sm border border-border bg-white">
        {preview ? (
          <img src={preview} alt={`Prévia - ${label}`} className="h-full w-full object-contain" />
        ) : (
          <div className="grid h-full place-items-center px-4 text-center text-xs text-muted-foreground">
            Sem imagem personalizada
          </div>
        )}
      </div>
      <input
        value={value}
        placeholder="URL da imagem"
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        className="mt-3 w-full text-xs"
      />
      <p className="mt-2 text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function SaveBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-sm bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110"
    >
      Salvar bloco
    </button>
  );
}
