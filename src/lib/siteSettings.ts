import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HeroSettings = {
  badge: string; title_line1: string; title_line2: string;
  subtitle: string; cta_primary: string; cta_secondary: string;
};
export type Stat = { k: string; v: string };
export type FAQItem = { q: string; a: string };
export type ContactSettings = { instagram: string; whatsapp: string; email: string };
export type FooterSettings = { tagline: string; copyright: string };

export type SiteSettings = {
  hero: HeroSettings;
  stats: Stat[];
  marquee: string[];
  contact: ContactSettings;
  faq: FAQItem[];
  footer: FooterSettings;
};

export const DEFAULTS: SiteSettings = {
  hero: {
    badge: "+5.000 produtos vendidos",
    title_line1: "PEDIU,",
    title_line2: "CHEGOU.",
    subtitle: "Eletrônicos, camisas, fones, smartwatches e variedades com a confiança de quem já entregou pra mais de 5 mil clientes. Entrega por motoboy. Pix, cartão e dinheiro.",
    cta_primary: "Fazer meu pedido",
    cta_secondary: "Ver categorias",
  },
  stats: [
    { k: "6.087", v: "seguidores no IG" },
    { k: "+5K", v: "produtos vendidos" },
    { k: "2018", v: "fundada em" },
  ],
  marquee: ["PIX","CARTÃO","DINHEIRO","MOTOBOY","ENTREGA RÁPIDA","GARANTIDA","SINCE 2018","ST ELETRÔNICOS"],
  contact: {
    instagram: "https://www.instagram.com/alojast/",
    whatsapp: "https://wa.me/?text=Ol%C3%A1%21+Vim+pelo+site+da+ST+Eletr%C3%B4nicos",
    email: "contato@alojast.com",
  },
  faq: [
    { q: "Quais formas de pagamento?", a: "Pix, cartão de crédito/débito (Visa, Master) e dinheiro na entrega." },
    { q: "Quanto tempo demora a entrega?", a: "Pedidos confirmados são enviados por motoboy no mesmo dia em horário comercial." },
    { q: "Posso trocar um produto?", a: "Sim, você tem até 7 dias para solicitar troca direto da sua conta." },
  ],
  footer: {
    tagline: "Loja oficial @alojast. Eletrônicos, camisas e variedades.",
    copyright: "© 2026 A Loja ST. Todos os direitos reservados.",
  },
};

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async (): Promise<SiteSettings> => {
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
      };
    },
    staleTime: 60_000,
  });
}
