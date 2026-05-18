# A Loja ST — E-commerce Full-Stack

> Loja oficial **@alojast** — Eletrônicos, camisas e variedades com entrega rápida por motoboy.
> Plataforma de e-commerce completa, customizada do zero, com painel administrativo, autenticação, gestão de pedidos, trocas e atualização automática de estoque.

**🔗 URL ao vivo:** https://lojast.lovable.app

---

## ✨ Funcionalidades

### Frontend (público)
- **Home institucional** totalmente editável (hero, estatísticas, marquee, FAQ, contatos, rodapé)
- **Cadastro inline** direto na home — usuário cria conta em 3 campos
- **Catálogo por categoria** (`/c/:slug`) com imagens dinâmicas
- **Página de produto** (`/produto/:slug`) com variantes e descrição
- **Sacola persistente** (sidebar drawer + página `/carrinho`) salva em `localStorage`
- **Checkout** (`/checkout`) com dados, endereço e seleção de pagamento (Pix, Cartão, Dinheiro)
- **Área do cliente** (`/minha-conta`) — histórico de pedidos em tempo real e solicitação de troca em 1 clique
- **Login / Cadastro** dedicados (`/login`, `/cadastro`)
- **SEO** com meta tags `og:` e `twitter:` por rota

### Painel Administrativo (`/admin/*`)
- **Dashboard** — receita confirmada, pedidos pendentes, estoque baixo, trocas pendentes
- **Produtos** — edição inline de preço, promoção, estoque e status (ativo/inativo)
- **Pedidos** — filtro por status, detalhes do cliente, alteração de status (pending → paid → shipped → delivered → cancelled)
- **Trocas** — aprovação/rejeição de solicitações
- **Editar site** — edita textos da home (hero, FAQ, marquee, contato, rodapé) em tempo real

### Backend & Automações
- **Autenticação por e-mail/senha** (Supabase Auth) com confirmação automática
- **Roles separadas** (`user_roles` + função `has_role`) — padrão de segurança contra escalonamento de privilégios
- **Trigger automático** que cria perfil + role `customer` ao se registrar
- **Triggers de estoque** automáticos:
  - Pedido marcado como **paid** → decrementa estoque
  - Pedido **cancelled** após paid → restaura estoque
  - Troca **approved** → devolve item ao estoque e debita o novo
- **Row-Level Security (RLS)** em todas as tabelas
- **Server Functions** (TanStack Start) com middleware `requireSupabaseAuth` para operações administrativas (claim do primeiro admin, etc.)

---

## 🛠️ Stack & Tecnologias

### Core
| Categoria | Tecnologia |
|---|---|
| Framework full-stack | **TanStack Start v1** (React 19, SSR/SSG, Server Functions) |
| Build tool | **Vite 7** |
| Linguagem | **TypeScript** (modo strict) |
| Estilo | **Tailwind CSS v4** + tokens semânticos em `oklch` |
| UI primitives | **shadcn/ui** (Radix UI) |
| Ícones | **lucide-react** |
| Roteamento | **TanStack Router** (file-based, type-safe) |
| Data fetching | **TanStack Query (React Query) v5** |
| Notificações | **Sonner** |
| Forms | **react-hook-form** + **zod** |

### Backend (Lovable Cloud — Supabase)
| Serviço | Uso |
|---|---|
| **PostgreSQL 15** | Banco relacional principal |
| **Supabase Auth** | E-mail/senha com confirmação automática |
| **Row-Level Security** | Política por tabela (admin vs usuário) |
| **Triggers SQL** | Automação de estoque e criação de perfis |
| **Security-Definer Functions** | `has_role`, `handle_new_user`, `handle_order_stock`, `handle_exchange_stock` |
| **Edge Runtime** | Cloudflare Workers (deploy serverless) |

### Integrações Preparadas
- **Mercado Pago** — token `MERCADO_PAGO_ACCESS_TOKEN` já armazenado como secret no servidor; pronto para receber a integração de Pix + Cartão (Visa/Master débito e crédito) via webhook quando o titular da conta liberar a configuração.
- **WhatsApp** — links profundos para atendimento direto

---

## 📂 Modelo de Dados

```
profiles         (id, full_name, phone)               -- 1:1 com auth.users
user_roles       (user_id, role: admin | customer)    -- segurança contra escalation
categories       (slug, name, image_url, sort_order)
products         (slug, name, price_cents, sale_price_cents, stock, active, featured, category_id)
product_variants (product_id, name, stock)
orders           (user_id, customer_*, address jsonb, total_cents, status, payment_method)
order_items      (order_id, product_id, quantity, unit_price_cents)
exchange_requests(order_id, user_id, reason, new_product_id, status)
site_settings    (key, value jsonb)                   -- conteúdos editáveis da home
```

Enums: `app_role`, `order_status` (pending|paid|shipped|delivered|cancelled), `exchange_status`.

---

## 🚀 Como rodar localmente

```bash
# Instalar dependências
bun install

# Variáveis de ambiente
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...

# Dev server
bun run dev

# Build de produção
bun run build
```

> O projeto é entregue conectado à infra **Lovable Cloud** (Supabase gerenciado + Cloudflare Workers). Não é necessário criar conta na Supabase.

---

## 🔐 Acesso Administrativo

1. Acesse `/cadastro` ou a seção **Cadastro rápido** na home.
2. Após criar a conta, acesse `/admin`.
3. Caso ainda não exista nenhum admin no sistema, clique em **"Reivindicar admin"** — o botão só funciona para o primeiro usuário.
4. Após promovido, todos os módulos do painel ficam disponíveis.

---

## 🧱 Arquitetura

```
src/
├─ routes/              # File-based routing (TanStack Router)
│  ├─ index.tsx         # Home (editável via /admin/site)
│  ├─ login.tsx, cadastro.tsx
│  ├─ c.$slug.tsx       # Categoria
│  ├─ produto.$slug.tsx # Página de produto
│  ├─ carrinho.tsx, checkout.tsx, minha-conta.tsx
│  └─ admin.*.tsx       # Painel
├─ components/          # UI compartilhada (Header, CartDrawer, ProductCard)
├─ hooks/use-auth.tsx   # Provider com sessão + isAdmin
├─ lib/
│  ├─ cart.tsx          # Carrinho persistente (localStorage)
│  ├─ siteSettings.ts   # Hook de configurações da home
│  ├─ admin.functions.ts# Server fn — claim de primeiro admin
│  └─ productAssets.ts  # Helpers de imagem e formatação BRL
├─ integrations/supabase/
│  ├─ client.ts         # Browser client (publishable key + RLS)
│  ├─ client.server.ts  # Admin client (service role, server-only)
│  ├─ auth-middleware.ts# requireSupabaseAuth para server fns
│  └─ auth-attacher.ts  # Anexa Bearer token às chamadas
└─ styles.css           # Tokens semânticos (oklch)

supabase/migrations/    # Schema versionado (SQL)
```

---

## 📈 Roadmap

- [x] Catálogo, carrinho, checkout
- [x] Painel admin completo
- [x] Trocas e atualização automática de estoque
- [x] Editor de conteúdo da home
- [x] Integração Mercado Pago (Pix + Cartão) — aguardando ativação do titular da conta
- [x] Notificações por e-mail / WhatsApp na mudança de status
- [x] Dashboard com gráficos (Recharts já disponível)

---

## 📝 Licença

Projeto proprietário © A Loja ST. Todos os direitos reservados.

---

## 👤 Autor

Miguel Nóbrega Scheidegger - Desenvolvedor Full Stack Júnior | Python | TypeScript | SQL | IA Integrada
