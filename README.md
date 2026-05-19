# A Loja ST — E-commerce Full-Stack

Projeto de e-commerce desenvolvido com **React, TypeScript, TanStack Start, Supabase e Cloudflare Workers**.  
A aplicação simula uma loja online com catálogo, categorias, página de produto, carrinho, checkout, autenticação de usuários e painel administrativo.

**URL em produção:** https://tanstack-start-app.alojast.workers.dev/

---

## Visão geral

O objetivo do projeto foi construir e publicar uma aplicação web completa, conectada a banco de dados, com fluxo real de deploy e organização profissional de ambiente.

Durante o desenvolvimento foram configurados:

- Frontend com React, TypeScript e TanStack Start.
- Backend e banco de dados com Supabase.
- Autenticação de usuários com Supabase Auth.
- Controle de permissões para cliente e administrador.
- Painel administrativo para gerenciar produtos, pedidos, trocas e textos do site.
- Catálogo público com categorias e produtos dinâmicos.
- Variações de produtos, como tamanhos, cores e opções.
- Carrinho persistente no navegador.
- Checkout com endereço, dados do cliente e forma de pagamento.
- Deploy serverless com Cloudflare Workers usando Wrangler.
- Versionamento com Git e GitHub.
- Proteção de chaves sensíveis usando secrets no Cloudflare.

---

## Tecnologias utilizadas

### Frontend

- **React 19**
- **TypeScript**
- **TanStack Start**
- **TanStack Router**
- **TanStack Query**
- **Vite**
- **Tailwind CSS**
- **shadcn/ui**
- **Radix UI**
- **Lucide React**
- **Sonner** para notificações

### Backend e banco de dados

- **Supabase**
- **PostgreSQL**
- **Supabase Auth**
- **Row Level Security — RLS**
- **SQL migrations**
- **Triggers e functions no banco**

### Deploy e infraestrutura

- **Cloudflare Workers**
- **Wrangler**
- **Cloudflare secrets**
- **Git**
- **GitHub**
- **Node.js / npm**

---

## Funcionalidades implementadas

### Área pública

- Página inicial institucional.
- Listagem de categorias.
- Páginas de categoria, como:
  - `/c/fones`
  - `/c/camisas`
  - `/c/smartwatch`
  - `/c/eletronicos`
- Página individual de produto.
- Exibição de preço normal e preço promocional.
- Exibição de estoque.
- Seleção de variações do produto:
  - tamanhos de camisa;
  - cores de fones;
  - opções de smartwatch;
  - opções de eletrônicos.
- Exibição de formas de pagamento:
  - Pix;
  - Cartão;
  - Dinheiro.
- Carrinho persistente usando `localStorage`.
- Página de checkout.
- Cadastro e login de usuários.
- Área do cliente com histórico de pedidos.
- Solicitação de troca de produto.

### Painel administrativo

O projeto possui uma área administrativa acessível por `/admin`, protegida por autenticação e controle de permissões.

Funcionalidades do painel:

- Dashboard com informações gerais.
- Gestão de produtos.
- Edição de preço, promoção, estoque e status do produto.
- Gestão de pedidos.
- Atualização de status de pedidos.
- Gestão de solicitações de troca.
- Edição de conteúdos do site, como hero, FAQ, contato e rodapé.
- Reivindicação do primeiro administrador quando ainda não existe admin cadastrado.

---

## Correções e ajustes realizados

Durante o desenvolvimento e publicação, foram feitos ajustes importantes para o projeto funcionar corretamente em produção:

### 1. Configuração do Supabase

Foram configuradas as variáveis necessárias para conectar a aplicação ao Supabase:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

Também foram configuradas variáveis server-side para o ambiente Cloudflare Workers:

```env
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

A `SUPABASE_SERVICE_ROLE_KEY` é usada apenas no servidor e não deve ser exposta no frontend ou enviada ao GitHub.

---

### 2. Publicação no GitHub

O projeto foi inicializado com Git, versionado e enviado para um repositório remoto no GitHub.

Fluxo utilizado:

```bash
git init
git add .
git commit -m "deploy inicial"
git branch -M main
git remote add origin https://github.com/usuario/repositorio.git
git push -u origin main
```

Também foi configurado o `.gitignore` para evitar o envio de arquivos sensíveis ou desnecessários, como:

```gitignore
.env
.env.local
.env.*
!.env.example
node_modules/
dist/
.workspace/
tsconfig.tsbuildinfo
```

---

### 3. Deploy na Cloudflare Workers

O projeto foi publicado usando **Cloudflare Workers** com **Wrangler**.

Comandos principais:

```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy
```

No Windows PowerShell, pode ser usado:

```powershell
npm.cmd install
npm.cmd run build
npx.cmd wrangler login
npx.cmd wrangler deploy
```

---

### 4. Configuração de secrets no Cloudflare

As chaves sensíveis foram configuradas como secrets no Cloudflare, sem expor dados no GitHub:

```bash
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_PUBLISHABLE_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

---

### 5. Correção de produtos e categorias

Foi criada uma migration para corrigir e popular os dados do catálogo:

```txt
supabase/migrations/20260519000000_seed_products_categories_variants.sql
```

Essa migration garante que as categorias usadas no site existam no Supabase e estejam vinculadas corretamente aos produtos:

- `camisas`
- `fones`
- `smartwatch`
- `eletronicos`

Também foram cadastrados produtos de teste ativos para cada categoria.

---

### 6. Correção de variações de produtos

Foram cadastradas variações para os produtos, permitindo que a página de produto exiba opções antes de adicionar ao carrinho.

Exemplos:

- Camisas: `P`, `M`, `G`, `GG`
- Fones: `Preto`, `Branco`, `Azul`
- Smartwatch: `Preto`, `Prata`, `Rosa`
- Eletrônicos: `1 metro`, `2 metros`, `20W`, `30W`

---

### 7. Correção das opções de pagamento

O checkout foi ajustado para exibir as formas de pagamento:

- Pix
- Cartão
- Dinheiro

A página de produto também passou a destacar as formas de pagamento antes do cliente adicionar o produto à sacola.

---

### 8. Correção do fluxo de checkout

O checkout passou a salvar corretamente:

- dados do cliente;
- endereço de entrega;
- forma de pagamento escolhida;
- itens do pedido;
- variação escolhida do produto;
- total do pedido.

Após confirmar o pedido, ele é salvo no Supabase com status inicial `pending`.

---

### 9. Controle de administrador

O sistema possui uma proteção para que apenas o primeiro usuário consiga reivindicar o papel de administrador automaticamente.

Depois que já existe um admin, novos usuários são cadastrados como clientes e só podem virar admin manualmente pelo Supabase ou por outro administrador.

---

## Estrutura do projeto

```txt
src/
├── assets/                 # Imagens do projeto
├── components/             # Componentes reutilizáveis
│   ├── CartDrawer.tsx
│   ├── ProductCard.tsx
│   └── SiteHeader.tsx
├── hooks/                  # Hooks personalizados
├── integrations/supabase/  # Cliente Supabase e tipos
├── lib/                    # Funções auxiliares, carrinho e regras
├── routes/                 # Rotas da aplicação
│   ├── index.tsx
│   ├── login.tsx
│   ├── cadastro.tsx
│   ├── c.$slug.tsx
│   ├── produto.$slug.tsx
│   ├── carrinho.tsx
│   ├── checkout.tsx
│   ├── minha-conta.tsx
│   └── admin.*.tsx
├── server.ts
├── start.ts
└── styles.css

supabase/
└── migrations/             # Estrutura e dados iniciais do banco

wrangler.jsonc              # Configuração da Cloudflare Workers
vite.config.ts              # Configuração do Vite/TanStack Start
package.json                # Scripts e dependências
```

---

## Modelo de dados principal

O banco foi estruturado com tabelas para suportar o funcionamento da loja:

- `profiles`
- `user_roles`
- `categories`
- `products`
- `product_variants`
- `orders`
- `order_items`
- `exchange_requests`
- `site_settings`

Também foram usados enums para controlar status e permissões:

- `app_role`: `admin`, `customer`
- `order_status`: `pending`, `paid`, `shipped`, `delivered`, `cancelled`
- `exchange_status`: `pending`, `approved`, `rejected`, `completed`

---

## Segurança

O projeto utiliza boas práticas básicas de segurança para uma aplicação web com backend:

- RLS habilitado no Supabase.
- Separação entre chave pública e chave de servidor.
- `SUPABASE_SERVICE_ROLE_KEY` usada apenas em ambiente server-side.
- Secrets configuradas no Cloudflare Workers.
- `.env` ignorado pelo Git.
- Painel admin protegido por autenticação e role.
- Usuários comuns não têm permissão de administrador por padrão.


---

## Autor

Desenvolvido por Miguel Nóbrega Scheidegger - Desenvolvedor Full Stack Junior | Python | TypeScript | IA integração com backend, deploy em cloud e versionamento profissional.

