import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL, productImage } from "@/lib/productAssets";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProducts,
});

type ProductFormState = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: string;
  salePrice: string;
  stock: string;
  categoryId: string;
  imageUrl: string;
  featured: boolean;
  active: boolean;
  variants: string;
};

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
};

type ProductVariantRow = {
  id: string;
  name: string;
  stock: number;
};

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  price_cents: number;
  sale_price_cents: number | null;
  stock: number;
  active: boolean;
  featured: boolean;
  image_url: string;
  category_id: string;
  categories: { name: string } | null;
  product_variants: ProductVariantRow[] | null;
};

type ProductUpdateField = "price_cents" | "sale_price_cents" | "stock" | "active";
type ProductUpdatePayload = {
  price_cents?: number;
  sale_price_cents?: number | null;
  stock?: number;
  active?: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  slug: "",
  description: "",
  brand: "ST",
  price: "",
  salePrice: "",
  stock: "0",
  categoryId: "",
  imageUrl: "",
  featured: false,
  active: true,
  variants: "",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toCents(value: string, nullable = false) {
  const clean = value.replace(",", ".").trim();
  if (!clean && nullable) return null;
  return Math.round(Number(clean || 0) * 100);
}

function variantsToText(variants: ProductVariantRow[] = []) {
  return variants.map((variant) => `${variant.name},${variant.stock ?? 0}`).join("\n");
}

function parseVariants(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, stock = "0"] = line.split(",").map((part) => part.trim());
      return { name, stock: Math.max(Number(stock || 0), 0) };
    })
    .filter((variant) => variant.name);
}

async function uploadProductImage(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "produto";
  const path = `products/${Date.now()}-${base}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

function AdminProducts() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProductFormState>(emptyForm);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CategoryOption[];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "id, name, slug, description, price_cents, sale_price_cents, stock, active, featured, image_url, brand, category_id, categories(name), product_variants(id, name, stock)",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as ProductRow[];
    },
  });

  const stats = useMemo(() => {
    const total = products?.length ?? 0;
    const active = products?.filter((product) => product.active).length ?? 0;
    return { total, active, inactive: total - active };
  }, [products]);

  const setField = <K extends keyof ProductFormState>(field: K, value: ProductFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const openCreate = () => {
    setForm({ ...emptyForm, categoryId: categories?.[0]?.id ?? "" });
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (product: ProductRow) => {
    setForm({
      id: product.id,
      name: product.name ?? "",
      slug: product.slug ?? "",
      description: product.description ?? "",
      brand: product.brand ?? "",
      price: product.price_cents != null ? (product.price_cents / 100).toFixed(2) : "",
      salePrice:
        product.sale_price_cents != null ? (product.sale_price_cents / 100).toFixed(2) : "",
      stock: String(product.stock ?? 0),
      categoryId: product.category_id ?? "",
      imageUrl: product.image_url ?? "",
      featured: Boolean(product.featured),
      active: Boolean(product.active),
      variants: variantsToText(product.product_variants ?? []),
    });
    setImageFile(null);
    setShowForm(true);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome do produto.");
    if (!form.categoryId) return toast.error("Selecione uma categoria.");
    if (!form.price.trim()) return toast.error("Informe o preço.");

    setSaving(true);
    try {
      const imageUrl = imageFile ? await uploadProductImage(imageFile) : form.imageUrl.trim();
      if (!imageUrl) throw new Error("Informe uma URL de imagem ou envie um arquivo.");

      const payload = {
        name: form.name.trim(),
        slug: (form.slug.trim() || slugify(form.name)).toLowerCase(),
        description: form.description.trim() || null,
        brand: form.brand.trim() || null,
        price_cents: toCents(form.price) ?? 0,
        sale_price_cents: toCents(form.salePrice, true),
        image_url: imageUrl,
        images: [imageUrl],
        category_id: form.categoryId,
        stock: Math.max(Number(form.stock || 0), 0),
        featured: form.featured,
        active: form.active,
      };

      let productId = form.id;
      if (form.id) {
        const { error } = await supabase.from("products").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        productId = data.id;
      }

      const variants = parseVariants(form.variants);
      if (productId) {
        const { error: deleteError } = await supabase
          .from("product_variants")
          .delete()
          .eq("product_id", productId);
        if (deleteError) throw deleteError;

        if (variants.length > 0) {
          const { error: insertError } = await supabase.from("product_variants").insert(
            variants.map((variant) => ({
              ...variant,
              product_id: productId,
            })),
          );
          if (insertError) throw insertError;
        }
      }

      toast.success(form.id ? "Produto atualizado" : "Produto cadastrado");
      setShowForm(false);
      setForm(emptyForm);
      setImageFile(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["category"] });
      qc.invalidateQueries({ queryKey: ["product"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const updateField = async (
    id: string,
    field: ProductUpdateField,
    value: ProductUpdatePayload[ProductUpdateField],
  ) => {
    const payload = { [field]: value } as ProductUpdatePayload;
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return toast.error(error.message);

    toast.success("Atualizado");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["category"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  const deleteProduct = async (product: ProductRow) => {
    const confirmed = window.confirm(
      `Excluir definitivamente o produto "${product.name}"?\n\nSe ele já estiver em algum pedido real, o Supabase pode bloquear a exclusão para preservar o histórico. Nesse caso, desative o produto.`,
    );
    if (!confirmed) return;

    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) {
      toast.error(
        "Não foi possível excluir. Se houver pedidos com esse produto, desative em vez de excluir.",
      );
      return;
    }

    toast.success("Produto excluído");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["category"] });
    qc.invalidateQueries({ queryKey: ["product"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre produtos, envie imagens, escolha categorias, ajuste preços, estoque, status e
            variações.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Novo produto
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Total" value={stats.total} />
        <Metric label="Ativos" value={stats.active} />
        <Metric label="Inativos" value={stats.inactive} />
      </div>

      {showForm && (
        <form
          onSubmit={saveProduct}
          className="space-y-4 rounded-sm border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="display text-2xl">{form.id ? "Editar produto" : "Novo produto"}</h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="grid h-8 w-8 place-items-center rounded-sm border border-border hover:border-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <div className="space-y-4">
              <Row>
                <Field
                  label="Nome"
                  value={form.name}
                  required
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      name: value,
                      slug: current.id ? current.slug : slugify(value),
                    }))
                  }
                />
                <Field
                  label="Slug / URL"
                  value={form.slug}
                  required
                  onChange={(value) => setField("slug", slugify(value))}
                />
              </Row>
              <Area
                label="Descrição"
                value={form.description}
                onChange={(value) => setField("description", value)}
                rows={4}
              />
              <Row>
                <Field
                  label="Marca"
                  value={form.brand}
                  onChange={(value) => setField("brand", value)}
                />
                <label className="block">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    Categoria
                  </span>
                  <select
                    value={form.categoryId}
                    onChange={(event) => setField("categoryId", event.target.value)}
                    className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Selecione</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>
              </Row>
              <Row>
                <MoneyField
                  label="Preço"
                  value={form.price}
                  required
                  onChange={(value) => setField("price", value)}
                />
                <MoneyField
                  label="Preço promocional"
                  value={form.salePrice}
                  onChange={(value) => setField("salePrice", value)}
                />
              </Row>
              <Row>
                <Field
                  label="Estoque geral"
                  type="number"
                  value={form.stock}
                  onChange={(value) => setField("stock", value)}
                />
                <Field
                  label="URL da imagem"
                  value={form.imageUrl}
                  placeholder="Cole uma URL ou envie um arquivo ao lado"
                  onChange={(value) => setField("imageUrl", value)}
                />
              </Row>
              <Area
                label="Tamanhos / variações"
                value={form.variants}
                rows={5}
                onChange={(value) => setField("variants", value)}
                placeholder={"Uma opção por linha. Exemplo:\nP,10\nM,8\nG,5"}
              />
              <div className="flex flex-wrap gap-5 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) => setField("active", event.target.checked)}
                  />{" "}
                  Ativo
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(event) => setField("featured", event.target.checked)}
                  />{" "}
                  Destaque
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-sm border border-border bg-background p-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">
                  Imagem do produto
                </div>
                <div className="mt-3 aspect-square overflow-hidden rounded-sm border border-border bg-white">
                  {imageFile || form.imageUrl ? (
                    <img
                      src={imageFile ? URL.createObjectURL(imageFile) : productImage(form.imageUrl)}
                      alt="Prévia"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center px-4 text-center text-xs text-muted-foreground">
                      Sem imagem
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                  className="mt-3 w-full text-xs"
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  O upload usa o bucket product-images no Supabase Storage.
                </p>
              </div>
              <button
                disabled={saving}
                className="w-full rounded-sm bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Salvando..." : form.id ? "Salvar alterações" : "Cadastrar produto"}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left">
              <th className="px-3 py-2">Produto</th>
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Preço</th>
              <th className="px-3 py-2">Promo</th>
              <th className="px-3 py-2">Estoque</th>
              <th className="px-3 py-2">Ativo</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {products?.map((product) => (
              <tr key={product.id} className="border-t border-border align-middle">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={productImage(product.image_url)}
                      alt=""
                      className="h-10 w-10 rounded-sm bg-white object-cover"
                    />
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {product.brand} · {product.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">{product.categories?.name}</td>
                <td className="px-3 py-2">
                  <EditableCents
                    value={product.price_cents}
                    onSave={(value) => updateField(product.id, "price_cents", value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableCents
                    value={product.sale_price_cents}
                    nullable
                    onSave={(value) => updateField(product.id, "sale_price_cents", value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <EditableNum
                    value={product.stock}
                    onSave={(value) => updateField(product.id, "stock", value)}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="checkbox"
                    checked={product.active}
                    onChange={(event) => updateField(product.id, "active", event.target.checked)}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(product)}
                      className="inline-flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary"
                    >
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => deleteProduct(product)}
                      className="inline-flex items-center gap-1 rounded-sm border border-destructive/40 px-3 py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        Clique nos valores de preço, promoção ou estoque para editar rapidamente. Use Editar para
        imagem, categoria, descrição, variações e configurações completas.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-sm border border-border bg-surface p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="display mt-1 text-3xl text-primary">{value}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
  rows = 3,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}

function MoneyField(props: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return <Field {...props} type="number" placeholder="0,00" />;
}

function EditableNum({ value, onSave }: { value: number; onSave: (value: number) => void }) {
  const [v, setV] = useState(String(value));
  return (
    <input
      type="number"
      value={v}
      onChange={(event) => setV(event.target.value)}
      onBlur={() => {
        if (Number(v) !== value) onSave(Number(v));
      }}
      className="w-20 rounded-sm border border-border bg-background px-2 py-1"
    />
  );
}

function EditableCents({
  value,
  nullable,
  onSave,
}: {
  value: number | null;
  nullable?: boolean;
  onSave: (value: number | null) => void;
}) {
  const [v, setV] = useState(value == null ? "" : (value / 100).toFixed(2));
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">R$</span>
      <input
        type="number"
        step="0.01"
        value={v}
        onChange={(event) => setV(event.target.value)}
        onBlur={() => {
          if (v === "" && nullable) {
            if (value != null) onSave(null);
            return;
          }
          const cents = Math.round(Number(v) * 100);
          if (cents !== value) onSave(cents);
        }}
        placeholder={nullable ? "-" : ""}
        className="w-24 rounded-sm border border-border bg-background px-2 py-1"
      />
      {value != null && <span className="text-xs text-muted-foreground">{formatBRL(value)}</span>}
    </div>
  );
}
