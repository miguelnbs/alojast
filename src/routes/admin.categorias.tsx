import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Edit, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { productImage } from "@/lib/productAssets";

export const Route = createFileRoute("/admin/categorias")({
  component: AdminCategories,
});

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  products?: { id: string }[];
};

type CategoryForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  sortOrder: string;
};

const emptyForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  sortOrder: "0",
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function uploadAsset(file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "categoria";
  const path = `categories/${Date.now()}-${base}.${ext}`;
  const { error } = await supabase.storage.from("site-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) throw error;
  const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
  return data.publicUrl;
}

function AdminCategories() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState<CategoryForm>(emptyForm);

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, slug, name, description, image_url, sort_order, products(id)")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data ?? []) as CategoryRow[];
    },
  });

  const nextSort = useMemo(() => {
    const currentMax = Math.max(
      0,
      ...(categories ?? []).map((category) => category.sort_order ?? 0),
    );
    return String(currentMax + 1);
  }, [categories]);

  const openCreate = () => {
    setForm({ ...emptyForm, sortOrder: nextSort });
    setImageFile(null);
    setShowForm(true);
  };

  const openEdit = (category: CategoryRow) => {
    setForm({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      imageUrl: category.image_url ?? "",
      sortOrder: String(category.sort_order ?? 0),
    });
    setImageFile(null);
    setShowForm(true);
  };

  const setField = <K extends keyof CategoryForm>(field: K, value: CategoryForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome da categoria.");

    setSaving(true);
    try {
      const imageUrl = imageFile ? await uploadAsset(imageFile) : form.imageUrl.trim();
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        description: form.description.trim() || null,
        image_url: imageUrl || null,
        sort_order: Math.max(Number(form.sortOrder || 0), 0),
      };

      if (form.id) {
        const { error } = await supabase.from("categories").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("categories").insert(payload);
        if (error) throw error;
      }

      toast.success(form.id ? "Categoria atualizada" : "Categoria criada");
      setShowForm(false);
      setForm(emptyForm);
      setImageFile(null);
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar categoria");
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (category: CategoryRow) => {
    const count = category.products?.length ?? 0;
    if (count > 0) {
      toast.error("Essa categoria tem produtos vinculados. Mova ou exclua os produtos antes.");
      return;
    }

    const ok = window.confirm(`Excluir definitivamente a categoria "${category.name}"?`);
    if (!ok) return;

    const { error } = await supabase.from("categories").delete().eq("id", category.id);
    if (error) return toast.error(error.message);

    toast.success("Categoria excluída");
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["public-categories"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="display text-4xl">Categorias</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Crie, edite, ordene e remova categorias usadas no menu, na home e no cadastro de
            produtos.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Nova categoria
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={saveCategory}
          className="space-y-4 rounded-sm border border-border bg-surface p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="display text-2xl">{form.id ? "Editar categoria" : "Nova categoria"}</h2>
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
                label="Descrição curta"
                value={form.description}
                onChange={(value) => setField("description", value)}
              />
              <Row>
                <Field
                  label="Ordem"
                  type="number"
                  value={form.sortOrder}
                  onChange={(value) => setField("sortOrder", value)}
                />
                <Field
                  label="URL da imagem"
                  value={form.imageUrl}
                  placeholder="Cole uma URL ou envie uma imagem ao lado"
                  onChange={(value) => setField("imageUrl", value)}
                />
              </Row>
            </div>

            <div className="rounded-sm border border-border bg-background p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Imagem</div>
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
            </div>
          </div>

          <button
            disabled={saving}
            className="rounded-sm bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60"
          >
            {saving ? "Salvando..." : form.id ? "Salvar categoria" : "Criar categoria"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded-sm border border-border">
        <table className="w-full text-sm">
          <thead className="bg-surface">
            <tr className="text-left">
              <th className="px-3 py-2">Categoria</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Ordem</th>
              <th className="px-3 py-2">Produtos</th>
              <th className="px-3 py-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {(categories ?? []).map((category) => (
              <tr key={category.id} className="border-t border-border align-middle">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={productImage(category.image_url)}
                      alt=""
                      className="h-10 w-10 rounded-sm bg-white object-cover"
                    />
                    <div>
                      <div className="font-semibold">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs">{category.slug}</td>
                <td className="px-3 py-2">{category.sort_order}</td>
                <td className="px-3 py-2">{category.products?.length ?? 0}</td>
                <td className="px-3 py-2">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => openEdit(category)}
                      className="inline-flex items-center gap-1 rounded-sm border border-border px-3 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary"
                    >
                      <Edit className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      onClick={() => deleteCategory(category)}
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
      {(!categories || categories.length === 0) && (
        <div className="rounded-sm border border-border bg-surface p-10 text-center text-muted-foreground">
          Nenhuma categoria cadastrada.
        </div>
      )}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        rows={3}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
      />
    </label>
  );
}
