import { Link } from "@tanstack/react-router";
import { User, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { CartButton } from "@/components/CartDrawer";
import logoSt from "@/assets/logo-st.png";

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoSt} alt="Logo Loja ST" className="h-10 w-10 object-contain" />
          <div className="leading-none">
            <div className="display text-xl">A LOJA ST</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">since 2018</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-wider md:flex">
          <Link to="/c/$slug" params={{ slug: "fones" }} className="hover:text-primary">Fones</Link>
          <Link to="/c/$slug" params={{ slug: "smartwatch" }} className="hover:text-primary">Smartwatch</Link>
          <Link to="/c/$slug" params={{ slug: "camisas" }} className="hover:text-primary">Camisas</Link>
          <Link to="/c/$slug" params={{ slug: "eletronicos" }} className="hover:text-primary">Eletrônicos</Link>
        </nav>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Link to="/admin" className="hidden md:inline-flex items-center gap-1 rounded-sm border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {user ? (
            <div className="hidden md:flex items-center gap-1">
              <Link to="/minha-conta" className="inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary">
                <User className="h-3.5 w-3.5" /> Conta
              </Link>
              <button onClick={signOut} aria-label="Sair" className="grid h-9 w-9 place-items-center rounded-sm border border-border text-muted-foreground hover:text-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="hidden md:inline-flex items-center gap-1 rounded-sm border border-border bg-surface px-3 py-2 text-xs font-bold uppercase tracking-wider hover:border-primary">
              <User className="h-3.5 w-3.5" /> Entrar
            </Link>
          )}
          <CartButton />
        </div>
      </div>
    </header>
  );
}
