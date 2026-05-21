import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
};

export const FALLBACK_CATEGORIES: PublicCategory[] = [
  {
    id: "fallback-camisas",
    slug: "camisas",
    name: "Camisas",
    description: "Times, retrôs e casuais",
    image_url: "cat-camisas.jpg",
    sort_order: 1,
  },
  {
    id: "fallback-fones",
    slug: "fones",
    name: "Fones",
    description: "Bluetooth, in-ear, gamer",
    image_url: "cat-fones.jpg",
    sort_order: 2,
  },
  {
    id: "fallback-smartwatch",
    slug: "smartwatch",
    name: "Smartwatch",
    description: "Modelos novos e clássicos",
    image_url: "cat-smartwatch.jpg",
    sort_order: 3,
  },
  {
    id: "fallback-eletronicos",
    slug: "eletronicos",
    name: "Eletrônicos",
    description: "Cabos, caixinhas, gadgets",
    image_url: "cat-eletronicos.jpg",
    sort_order: 4,
  },
];

export function usePublicCategories() {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: async (): Promise<PublicCategory[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, description, image_url, sort_order")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
