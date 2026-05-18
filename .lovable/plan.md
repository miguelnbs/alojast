## Visão geral

Transformar a landing atual em uma loja real, com banco de dados, painel admin pra gerenciar tudo, e fluxo completo de compra estilo Nike. Como o Instagram não expõe preços/estoque de forma estruturada, vou popular o catálogo com produtos de exemplo editáveis (fones, smartwatches, camisas, eletrônicos) que você ajusta depois no painel.

## Etapas (entregues em fases — não tudo de uma vez)

### Fase 1 — Fundação (esta entrega)
1. **Ativar Lovable Cloud** (banco + auth + storage).
2. **Modelagem do banco**:
   - `categories` (slug, nome, imagem)
   - `products` (nome, descrição, preço, preço promocional, imagens[], categoria, estoque, ativo)
   - `product_variants` (tamanho/cor, estoque por variante) — opcional, útil pra camisas
   - `orders` (cliente, status, total, endereço, método pagamento)
   - `order_items` (produto, variante, qtd, preço unitário)
   - `exchange_requests` (pedido, motivo, status, novo produto)
   - `user_roles` (admin/cliente — tabela separada por segurança)
   - RLS em todas as tabelas + trigger pra abater estoque automaticamente quando pedido vira "pago".
3. **Páginas de categoria** (`/fones`, `/smartwatch`, `/camisas`, `/eletronicos`):
   - Grid de produtos com filtros (preço, em estoque) e ordenação.
   - Card de produto com imagem, nome, preço, badge de promo.
4. **Página de produto** (`/produto/:slug`):
   - Galeria, descrição, seletor de variante, botão "Adicionar ao carrinho", indicador de estoque.
5. **Seed de produtos de exemplo** (uns 16–20 produtos, ~4–5 por categoria) com imagens geradas.

### Fase 2 — Compra (próxima entrega)
6. **Carrinho** (drawer lateral, persistido em localStorage + sincronizado se logado).
7. **Checkout**: dados do cliente, endereço, frete fixo simples, escolha de pagamento.
8. **Pagamentos**: integração Stripe (Pix + Cartão) via Lovable Cloud — você não precisa de conta Stripe, é gerenciado.
9. **Webhook de pagamento** que confirma pedido e dispara o trigger de baixa de estoque.

### Fase 3 — Pós-venda + admin (entrega seguinte)
10. **Conta do cliente** (`/minha-conta`): pedidos, status, solicitar troca.
11. **Fluxo de troca**: cliente abre solicitação → admin aprova/recusa → estoque é reajustado.
12. **Painel admin** (`/admin`, protegido por role):
    - CRUD de produtos e categorias (com upload de imagens pro Storage).
    - Lista de pedidos com filtros por status.
    - Gestão de trocas.
    - Dashboard simples (vendas do dia, top produtos, estoque baixo).

## Detalhes técnicos

- **Stack**: TanStack Start (atual) + Lovable Cloud (Supabase) + shadcn/ui já instalado.
- **Rotas novas**: `/[categoria-slug]`, `/produto/$slug`, `/carrinho`, `/checkout`, `/minha-conta`, `/admin/*`, `/login`, `/cadastro`.
- **Pagamentos**: vou usar `enable_stripe_payments` (built-in da Lovable, sem necessidade de conta Stripe pra testar). Se preferir Pix nativo via Mercado Pago/Asaas depois, dá pra trocar.
- **Estoque automático**: trigger no Postgres que decrementa `products.stock` quando `orders.status` muda pra `paid` e re-incrementa em cancelamento/troca aprovada.
- **Segurança**: `user_roles` separada com função `has_role()` (sem coluna de role no profile, pra evitar escalonamento de privilégio).
- **Imagens**: gero 16–20 imagens de produto (estilo catálogo limpo) com `imagegen` e subo pro Storage.

## Tempo e expectativas

- Fase 1 leva esta resposta inteira (banco + categorias + produtos seed + páginas de listagem/detalhe).
- Fase 2 e 3 são entregas separadas pra cada parte ficar testada antes de seguir. Não dá pra fazer tudo em uma mensagem — fica instável.

## Confirmações antes de começar

1. Posso ativar **Lovable Cloud** agora (necessário pra banco/auth/storage)?
2. **Pagamentos**: top usar o Stripe gerenciado da Lovable (Pix + cartão, sem você precisar criar conta) ou prefere outra coisa? — pode confirmar isso só na Fase 2.
3. Confirmo: começo pela **Fase 1** nesta resposta e seguimos pras próximas após você validar?
