# Bete Atelier - Frontend

PWA para tablet onde clientes podem navegar pelo catálogo de vestidos e acessórios e fazer pedidos para experimentar.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4 + shadcn/ui
- React Router
- TanStack Query (React Query)
- Zustand (gerenciamento de estado)
- vite-plugin-pwa (Service Worker + manifest)

## Pré-requisitos

- Node.js 20+
- Backend rodando ([atelier-backend](../atelier-backend))

## Setup

```bash
npm install
cp .env.example .env
npm run dev
```

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `VITE_API_URL` | URL base da API | `http://localhost:3000` |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento |
| `npm run build` | Build de produção (com PWA) |
| `npm run preview` | Preview do build de produção |

## Estrutura

```
src/
├── api/          # Cliente HTTP (fetch wrapper)
├── components/ui # Componentes shadcn/ui
├── hooks/        # React Query hooks (useCategories, useItems, useCreateOrder)
├── lib/          # Utilitários (cn helper)
├── pages/        # Páginas da aplicação
├── stores/       # Zustand stores (carrinho)
└── types/        # Tipos TypeScript
```

## Rotas

| Rota | Página |
|------|--------|
| `/` | Splash screen |
| `/categorias` | Categorias do catálogo |
| `/categorias/:id/itens` | Itens de uma categoria |
| `/itens/:id` | Detalhes do item |
| `/carrinho` | Carrinho de experimentação |
| `/pedido-sucesso` | Confirmação do pedido |
