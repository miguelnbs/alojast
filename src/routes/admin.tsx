import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Package2, ShoppingBag, RefreshCw, ShieldCheck, FileEdit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { claimFirstAdmin } from "@/lib/admin.functions";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — A Loja ST" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: AdminLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package2 },
  { to: "/admin/pedidos", label: "Pedidos", icon: ShoppingBag },
  { to: "/admin/trocas", label: "Trocas", icon: RefreshCw },
  { to: "/admin/site", label: "Editar site", icon: FileEdit },
];

function AdminLayout() {
  const { isAdmin, user, loading } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (loading) return <div className="p-10 text-center text-muted-foreground">Carregando...</div>;

  if (!isAdmin) return <ClaimAdmin />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3">
          <Link to="/admin" className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="display text-xl">ST Admin</span>
          </Link>
          <div className="text-xs text-muted-foreground">{user?.email}</div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {NAV.map((n) => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex items-center gap-2 rounded-sm px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-surface-2"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
          <Link to="/" className="mt-4 block px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground hover:text-primary">← Voltar à loja</Link>
        </nav>
        <main><Outlet /></main>
      </div>
    </div>
  );
}

function ClaimAdmin() {
  const { user } = useAuth();
  const claim = useServerFn(claimFirstAdmin);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      await claim({});
      toast.success("Você agora é admin! Recarregando...");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: any) {
      toast.error(e.message ?? "Erro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
      <h1 className="display mt-4 text-4xl">Área restrita</h1>
      <p className="mt-2 text-sm text-muted-foreground">Esta área é só para administradores.</p>
      {user && (
        <div className="mt-8 rounded-sm border border-border bg-surface p-6">
          <p className="text-sm">Se você é o dono da loja e ainda não há admin cadastrado, clique abaixo para se tornar admin (válido só pra primeira vez).</p>
          <button onClick={run} disabled={loading} className="mt-4 w-full rounded-sm bg-primary py-3 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60">
            {loading ? "..." : "Reivindicar admin"}
          </button>
        </div>
      )}
      <Link to="/" className="mt-8 inline-block text-xs uppercase tracking-wider text-muted-foreground hover:text-primary">← Voltar à loja</Link>
    </div>
  );
}
