// Resolve product image filenames stored in DB to bundled Vite assets.
const productImages = import.meta.glob("@/assets/products/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const categoryImages = import.meta.glob("@/assets/cat-*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const productMap: Record<string, string> = {};
for (const [path, url] of Object.entries(productImages)) {
  const filename = path.split("/").pop()!;
  productMap[filename] = url;
}

const categoryMap: Record<string, string> = {};
for (const [path, url] of Object.entries(categoryImages)) {
  const filename = path.split("/").pop()!;
  categoryMap[filename] = url;
}

export function productImage(filename: string | null | undefined): string {
  if (!filename) return "";
  return productMap[filename] ?? categoryMap[filename] ?? "";
}

export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
