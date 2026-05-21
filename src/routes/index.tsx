import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Star,
  Zap,
  Truck,
  ShieldCheck,
  CreditCard,
  Banknote,
  Instagram,
  MessageCircle,
  ArrowRight,
  Check,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import heroProducts from "@/assets/hero-products.jpg";
import logoSt from "@/assets/logo-st.png";
import catFones from "@/assets/cat-fones.jpg";
import catSmartwatch from "@/assets/cat-smartwatch.jpg";
import catCamisas from "@/assets/cat-camisas.jpg";
import motoboy from "@/assets/motoboy.jpg";
import { SiteHeader } from "@/components/SiteHeader";
import { useSiteSettings, DEFAULTS } from "@/lib/siteSettings";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { FALLBACK_CATEGORIES, usePublicCategories } from "@/lib/catalog";
import { productImage } from "@/lib/productAssets";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "A Loja ST — Eletrônicos, Camisas e Variedades com Entrega Rápida" },
      {
        name: "description",
        content:
          "+10.000 produtos vendidos. Fones, smartwatch, camisas e eletrônicos. Pix, cartão e dinheiro. Cadastre-se e peça em 1 clique.",
      },
      { property: "og:title", content: "A Loja ST — Pediu, Chegou" },
      {
        property: "og:description",
        content: "Loja oficial @alojast. Eletrônicos, camisas e variedades com entrega rápida.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data } = useSiteSettings();
  const s = data ?? DEFAULTS;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero hero={s.hero} stats={s.stats} contact={s.contact} />
        <Marquee items={s.marquee} />
        <Categorias />
        <Destaques contact={s.contact} />
        <ComoFunciona />
        <Entrega />
        <SignupSection />
        <Depoimentos />
        <FAQ faq={s.faq} />
        <CTA contact={s.contact} />
      </main>
      <Footer footer={s.footer} contact={s.contact} visual={s.visual} />
    </div>
  );
}

/* ---------------- HERO ---------------- */
function Hero({
  hero,
  stats,
  contact,
}: {
  hero: typeof DEFAULTS.hero;
  stats: typeof DEFAULTS.stats;
  contact: typeof DEFAULTS.contact;
}) {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 grid-noise opacity-40" />
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-5 pb-20 pt-16 md:grid-cols-12 md:pt-24">
        <div className="md:col-span-6 lg:col-span-7">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
            <Zap className="h-3 w-3" /> {hero.badge}
          </div>
          <h1 className="display text-[clamp(3rem,8vw,7rem)] leading-[0.9] text-balance">
            {hero.title_line1}
            <br />
            <span className="text-primary">{hero.title_line2}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={contact.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-4 text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:brightness-110"
            >
              {hero.cta_primary}{" "}
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a
              href="#categorias"
              className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-6 py-4 text-sm font-bold uppercase tracking-widest text-foreground transition hover:border-primary"
            >
              {hero.cta_secondary}
            </a>
          </div>
          <dl className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
            {stats.map((stat) => (
              <div key={stat.v}>
                <dt className="display text-3xl text-primary md:text-4xl">{stat.k}</dt>
                <dd className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                  {stat.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="md:col-span-6 lg:col-span-5">
          <div className="relative">
            <div className="absolute inset-4 -z-10 rounded-sm bg-primary/30 blur-2xl" />
            <img
              src={heroProducts}
              alt="Fones, smartwatch e camisa em destaque"
              width={1600}
              height={1280}
              className="w-full rounded-sm border border-border object-cover"
            />
            <div className="absolute -bottom-6 -left-6 rounded-sm border border-border bg-background px-5 py-4 shadow-2xl">
              <div className="flex items-center gap-2 text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                Avaliação dos clientes
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- MARQUEE ---------------- */
function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items, ...items];
  return (
    <div className="overflow-hidden border-y border-border bg-primary text-primary-foreground">
      <div className="marquee flex whitespace-nowrap py-3">
        {row.map((t, i) => (
          <span key={i} className="display mx-8 text-2xl tracking-widest">
            {t} <span className="mx-8 opacity-50">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Categorias() {
  const { data } = usePublicCategories();
  const categories = data?.length ? data : FALLBACK_CATEGORIES;

  return (
    <section id="categorias" className="mx-auto max-w-7xl px-5 py-24">
      <SectionHead
        eyebrow="O catálogo"
        title={
          <>
            Categorias <span className="text-primary">destaque</span>
          </>
        }
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((c) => {
          const image = productImage(c.image_url) || heroProducts;
          return (
            <Link
              key={c.slug}
              to="/c/$slug"
              params={{ slug: c.slug }}
              className="group relative overflow-hidden rounded-sm border border-border bg-surface transition hover:border-primary"
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={image}
                  alt={c.name}
                  loading="lazy"
                  width={800}
                  height={800}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex items-center justify-between border-t border-border p-5">
                <div>
                  <div className="display text-2xl">{c.name}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">
                    {c.description}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-primary transition group-hover:translate-x-1" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- DESTAQUES ---------------- */
const HIGHLIGHTS = [
  {
    tag: "Mais pedido",
    title: "Fone Bluetooth Premium",
    line: "Bateria de alta duração com som imersivo.",
    img: catFones,
  },
  {
    tag: "Tendência",
    title: "Smartwatch Série Y",
    line: "Notificações, monitor cardíaco e GPS.",
    img: catSmartwatch,
  },
  {
    tag: "Coleção",
    title: "Camisas Oficiais",
    line: "Times nacionais e europeus, várias temporadas.",
    img: catCamisas,
  },
];

function Destaques({ contact }: { contact: typeof DEFAULTS.contact }) {
  return (
    <section id="destaques" className="border-t border-border bg-surface/40">
      <div className="mx-auto max-w-7xl px-5 py-24">
        <SectionHead
          eyebrow="Produtos em alta"
          title={
            <>
              O que está <span className="text-primary">saindo</span> da loja
            </>
          }
          right={
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary hover:underline md:inline-flex"
            >
              Ver tudo no Instagram <ArrowRight className="h-4 w-4" />
            </a>
          }
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {HIGHLIGHTS.map((h) => (
            <article
              key={h.title}
              className="group relative overflow-hidden rounded-sm border border-border bg-background"
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={h.img}
                  alt={h.title}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
              </div>
              <div className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
                {h.tag}
              </div>
              <div className="border-t border-border p-6">
                <h3 className="display text-2xl">{h.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{h.line}</p>
                <a
                  href={contact.whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-primary hover:underline"
                >
                  Tenho interesse <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- COMO FUNCIONA ---------------- */
function ComoFunciona() {
  const steps = [
    {
      n: "01",
      t: "Escolha o produto",
      d: "Veja as categorias ou peça uma indicação direto pelo WhatsApp.",
    },
    { n: "02", t: "Confirme o pagamento", d: "Pix, cartão de crédito ou dinheiro na entrega." },
    { n: "03", t: "Receba em casa", d: "Entrega rápida por motoboy. Acompanhe em tempo real." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <SectionHead
        eyebrow="Como funciona"
        title={
          <>
            3 passos <span className="text-primary">e pronto</span>
          </>
        }
      />
      <div className="mt-12 grid gap-px overflow-hidden rounded-sm border border-border bg-border md:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="bg-background p-8">
            <div className="display text-6xl text-primary">{s.n}</div>
            <div className="display mt-4 text-2xl">{s.t}</div>
            <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- ENTREGA ---------------- */
function Entrega() {
  const pay = [
    { i: <Zap className="h-5 w-5" />, t: "Pix" },
    { i: <CreditCard className="h-5 w-5" />, t: "Cartão" },
    { i: <Banknote className="h-5 w-5" />, t: "Dinheiro" },
  ];
  return (
    <section id="entrega" className="relative overflow-hidden border-y border-border bg-surface/40">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-24 md:grid-cols-2 md:items-center">
        <div>
          <div className="display text-xs uppercase tracking-[0.3em] text-primary">
            Pediu, chegou
          </div>
          <h2 className="display mt-3 text-5xl md:text-6xl">
            Entrega por <span className="text-primary">motoboy</span>
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Receba na sua casa, no trabalho ou onde você estiver.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            {[
              "Atendimento humano via WhatsApp",
              "Embalagem segura para eletrônicos",
              "Garantia em todos os produtos",
              "Suporte pós-venda dedicado",
            ].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">
              Formas de pagamento
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {pay.map((p) => (
                <span
                  key={p.t}
                  className="inline-flex items-center gap-2 rounded-sm border border-border bg-background px-4 py-2 text-sm font-bold"
                >
                  {p.i} {p.t}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="relative">
          <img
            src={motoboy}
            alt="Entrega por motoboy"
            loading="lazy"
            width={1200}
            height={800}
            className="w-full rounded-sm border border-border"
          />
        </div>
      </div>
    </section>
  );
}

/* ---------------- SIGNUP NA HOME ---------------- */
function SignupSection() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  if (user) {
    return (
      <section className="border-t border-border bg-surface/40">
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <UserPlus className="mx-auto h-8 w-8 text-primary" />
          <h2 className="display mt-3 text-3xl">Você já tem conta ✓</h2>
          <p className="mt-2 text-muted-foreground">
            Acesse sua área pra acompanhar pedidos e pedir trocas.
          </p>
          <Link
            to="/minha-conta"
            className="mt-6 inline-block rounded-sm bg-primary px-6 py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground"
          >
            Minha conta
          </Link>
        </div>
      </section>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: form.name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cadastro criado! Bem-vindo à ST.");
    nav({ to: "/minha-conta" });
  };

  return (
    <section id="cadastro" className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-24 md:grid-cols-2 md:items-center">
        <div>
          <div className="display text-xs uppercase tracking-[0.3em] text-primary">
            Crie sua conta
          </div>
          <h2 className="display mt-3 text-5xl">
            Compre mais <span className="text-primary">rápido</span>.
          </h2>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Histórico de pedidos sempre à mão",
              "Solicite trocas em 1 clique",
              "Checkout sem digitar tudo de novo",
              "Status do pedido em tempo real",
            ].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3.5 w-3.5" />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
        <form
          onSubmit={submit}
          className="space-y-3 rounded-sm border border-border bg-surface p-6"
        >
          <h3 className="display text-2xl">Cadastro rápido</h3>
          <input
            required
            placeholder="Seu nome completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm"
          />
          <input
            required
            type="email"
            placeholder="seu@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            minLength={6}
            placeholder="Senha (mín. 6 caracteres)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-sm border border-border bg-background px-4 py-3 text-sm"
          />
          <button
            disabled={loading}
            className="w-full rounded-sm bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Criando..." : "Criar conta"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </section>
  );
}

/* ---------------- DEPOIMENTOS ---------------- */
const REVIEWS = [
  {
    n: "Alice A.",
    r: "Comprei meu fone bluetooth e chegou no mesmo dia. Atendimento top.",
    t: "Cliente desde 2023",
  },
  { n: "Thalles S.", r: "Já fiz 4 pedidos. Sempre original, sempre rápido.", t: "Cliente VIP" },
  { n: "Marcos R.", r: "Camisa do time chegou perfeita. Preço justo.", t: "Cliente recorrente" },
];
function Depoimentos() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-24">
      <SectionHead
        eyebrow="Feedback real"
        title={
          <>
            Quem compra, <span className="text-primary">volta</span>
          </>
        }
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {REVIEWS.map((r) => (
          <figure
            key={r.n}
            className="flex flex-col rounded-sm border border-border bg-surface p-6"
          >
            <div className="flex gap-1 text-primary">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <blockquote className="mt-4 grow text-lg leading-snug">"{r.r}"</blockquote>
            <figcaption className="mt-6 border-t border-border pt-4">
              <div className="font-bold">{r.n}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{r.t}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ---------------- FAQ ---------------- */
function FAQ({ faq }: { faq: typeof DEFAULTS.faq }) {
  return (
    <section id="faq" className="border-y border-border bg-surface/40">
      <div className="mx-auto max-w-4xl px-5 py-24">
        <SectionHead
          eyebrow="Perguntas frequentes"
          title={
            <>
              Tirando suas <span className="text-primary">dúvidas</span>
            </>
          }
        />
        <div className="mt-10 divide-y divide-border rounded-sm border border-border bg-background">
          {faq.map((f, i) => (
            <details key={i} className="group p-6 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-bold uppercase tracking-wider">
                {f.q}
                <span className="display text-3xl text-primary transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
function CTA({ contact }: { contact: typeof DEFAULTS.contact }) {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 grid-noise opacity-40" />
      <div className="relative mx-auto max-w-5xl px-5 py-28 text-center">
        <div className="display text-xs uppercase tracking-[0.3em] text-primary">
          faça seu pedido
        </div>
        <h2 className="display mt-4 text-[clamp(3rem,8vw,6.5rem)] leading-[0.9] text-balance">
          BORA FECHAR <span className="text-primary">SEU PEDIDO</span>?
        </h2>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a
            href={contact.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm bg-primary px-8 py-5 text-sm font-bold uppercase tracking-widest text-primary-foreground transition hover:brightness-110 glow-yellow"
          >
            <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
          </a>
          <a
            href={contact.instagram}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-sm border border-border bg-surface px-8 py-5 text-sm font-bold uppercase tracking-widest hover:border-primary"
          >
            <Instagram className="h-4 w-4" /> Seguir @alojast
          </a>
        </div>
      </div>
    </section>
  );
}

/* ---------------- FOOTER ---------------- */
function Footer({
  footer,
  contact,
  visual,
}: {
  footer: typeof DEFAULTS.footer;
  contact: typeof DEFAULTS.contact;
  visual: typeof DEFAULTS.visual;
}) {
  const { data } = usePublicCategories();
  const categories = data?.length ? data : FALLBACK_CATEGORIES;
  const logo = visual.logo_url.trim() || logoSt;

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-3">
        <div className="flex items-start gap-3">
          <img src={logo} alt="Logo Loja ST" className="h-12 w-12 object-contain" />
          <div>
            <div className="display text-xl">{visual.logo_title || "A LOJA ST"}</div>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">{footer.tagline}</p>
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Categorias</div>
          <ul className="mt-3 space-y-1 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to="/c/$slug" params={{ slug: c.slug }} className="hover:text-primary">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">
            Fale com a gente
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a
                href={contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <Instagram className="h-4 w-4" /> @alojast
              </a>
            </li>
            <li>
              <a
                href={contact.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 hover:text-primary"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Truck className="h-4 w-4 text-primary" /> Entrega por motoboy
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Garantia em todos os produtos
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs uppercase tracking-widest text-muted-foreground">
          <span>{footer.copyright}</span>
          <span>Pediu, chegou.</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- SHARED ---------------- */
function SectionHead({
  eyebrow,
  title,
  right,
}: {
  eyebrow: string;
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <div className="display text-xs uppercase tracking-[0.3em] text-primary">{eyebrow}</div>
        <h2 className="display mt-3 text-5xl md:text-6xl text-balance">{title}</h2>
      </div>
      {right}
    </div>
  );
}
