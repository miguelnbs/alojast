import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Cadastro — A Loja ST" }] }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Cadastro feito! Você já pode entrar.");
    nav({ to: "/minha-conta" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="display text-5xl">Criar conta</h1>
        <p className="mt-2 text-sm text-muted-foreground">Acompanhe seus pedidos, salve endereços e peça trocas com 1 clique.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Nome completo</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="mt-1 w-full rounded-sm border border-border bg-surface px-4 py-3" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">E-mail</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="mt-1 w-full rounded-sm border border-border bg-surface px-4 py-3" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Senha (mín. 6)</label>
            <input type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} required
              className="mt-1 w-full rounded-sm border border-border bg-surface px-4 py-3" />
          </div>
          <button disabled={loading} className="w-full rounded-sm bg-primary py-4 text-sm font-bold uppercase tracking-wider text-primary-foreground hover:brightness-110 disabled:opacity-60">
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="text-primary underline">Entrar</Link>
        </p>
      </main>
    </div>
  );
}
