import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HeroSettings = {
  badge: string;
  title_line1: string;
  title_line2: string;
  subtitle: string;
  cta_primary: string;
  cta_secondary: string;
};
export type Stat = { k: string; v: string };
export type FAQItem = { q: string; a: string };
export type ContactSettings = { instagram: string; whatsapp: string; email: string };
export type FooterSettings = { tagline: string; copyright: string };
export type VisualSettings = {
  primary_color: string;
  primary_foreground_color: string;
  background_color: string;
  surface_color: string;
  surface_2_color: string;
  text_color: string;
  muted_text_color: string;
  border_color: string;
  logo_title: string;
  logo_subtitle: string;
  logo_url: string;
  hero_image_url: string;
};

export type SiteSettings = {
  hero: HeroSettings;
  stats: Stat[];
  marquee: string[];
  contact: ContactSettings;
  faq: FAQItem[];
  footer: FooterSettings;
  visual: VisualSettings;
};

export const DEFAULTS: SiteSettings = {
  hero: {
    badge: "+10.000 produtos vendidos",
    title_line1: "PEDIU,",
    title_line2: "CHEGOU.",
    subtitle:
      "Eletrônicos, camisas, fones, smartwatches e variedades com a confiança de quem já entregou pra mais de 5 mil clientes. Entrega por motoboy. Pix, cartão e dinheiro.",
    cta_primary: "Fazer meu pedido",
    cta_secondary: "Ver categorias",
  },
  stats: [
    { k: "+6K", v: "seguidores no IG" },
    { k: "+10K", v: "produtos vendidos" },
    { k: "2018", v: "fundada em" },
  ],
  marquee: [
    "PIX",
    "CARTÃO",
    "DINHEIRO",
    "MOTOBOY",
    "ENTREGA RÁPIDA",
    "GARANTIDA",
    "SINCE 2018",
    "ST ELETRÔNICOS",
  ],
  contact: {
    instagram: "https://www.instagram.com/alojast/",
    whatsapp: "https://wa.me/?text=Ol%C3%A1%21+Vim+pelo+site+da+ST+Eletr%C3%B4nicos",
    email: "contato@alojast.com",
  },
  faq: [
    {
      q: "Quais formas de pagamento?",
      a: "Pix, cartão de crédito/débito (Visa, Master) e dinheiro na entrega.",
    },
    {
      q: "Quanto tempo demora a entrega?",
      a: "Pedidos confirmados são enviados por motoboy no mesmo dia em horário comercial.",
    },
    {
      q: "Posso trocar um produto?",
      a: "Sim, você tem até 7 dias para solicitar troca direto da sua conta.",
    },
  ],
  footer: {
    tagline: "Loja oficial @alojast. Eletrônicos, camisas e variedades.",
    copyright: "© 2026 A Loja ST. Todos os direitos reservados.",
  },
  visual: {
    primary_color: "#f7c600",
    primary_foreground_color: "#070707",
    background_color: "#070707",
    surface_color: "#151515",
    surface_2_color: "#202020",
    text_color: "#fafafa",
    muted_text_color: "#a3a3a3",
    border_color: "#303030",
    logo_title: "A LOJA ST",
    logo_subtitle: "SINCE 2018",
    logo_url: "",
    hero_image_url: "",
  },
};

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
      const { data } = await supabase.from("site_settings").select("key, value");
      const map: Record<string, unknown> = {};
      (data ?? []).forEach((r) => {
        map[r.key] = r.value;
      });
      return {
        hero: { ...DEFAULTS.hero, ...objectValue(map.hero) },
        stats: Array.isArray(map.stats) ? map.stats : DEFAULTS.stats,
        marquee: Array.isArray(map.marquee) ? map.marquee : DEFAULTS.marquee,
        contact: { ...DEFAULTS.contact, ...objectValue(map.contact) },
        faq: Array.isArray(map.faq) ? map.faq : DEFAULTS.faq,
        footer: { ...DEFAULTS.footer, ...objectValue(map.footer) },
        visual: { ...DEFAULTS.visual, ...objectValue(map.visual) },
      };
    },
    staleTime: 60_000,
  });
}
