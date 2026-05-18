import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — A Loja ST" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    nav({ to: "/minha-conta" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="display text-5xl">Entrar</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acesse sua conta para acompanhar pedidos e solicitar trocas.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</label>
            <input
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border bg-surface px-4 py-3"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Senha</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-sm border border-border bg-surface px-4 py-3"
            />
          </div>
          <button disabled={loading} className="w-full rounded-sm bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não tem conta?{" "}
          <Link to="/cadastro" className="text-primary underline">Cadastre-se</Link>
        </p>
      </main>
    </div>
  );
}
