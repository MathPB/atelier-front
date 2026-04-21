# Histórico de Alterações — Atelier Frontend

---

## [2026-03-31] Otimizações de Performance, PWA e UX

### Contexto
Melhorias gerais de performance, experiência do usuário e qualidade de código identificadas antes do crescimento da base de usuários em produção.

### Persistência de estado (localStorage)

#### `src/stores/cartStore.ts`
- Adicionado middleware `persist` do Zustand com chave `bete-cart`
- Carrinho agora sobrevive a refresh e fechamento de aba

#### `src/stores/userStore.ts`
- Adicionado middleware `persist` com chave `bete-user`
- Sessão do admin (token + `isMaster`) preservada entre recarregamentos

### Performance de carregamento

#### `src/App.tsx`
- Rotas secundárias convertidas para `React.lazy()` + `<Suspense>`: `LoginPage`, `CategoriesPage`, `ItemsPage`, `OrderSuccessPage`, `AddItemPage`, `EditItemPage`, `AgendaPage`
- Rotas críticas (`HomePage`, `ItemDetailPage`, `CartPage`) mantidas como imports estáticos
- `staleTime` do React Query: 2 min → 15 min (catálogo raramente muda)
- `gcTime` adicionado: 30 min (dados permanecem em cache ao navegar entre páginas)
- `<ErrorBoundary>` e `<Suspense>` envolvendo todas as rotas; `<PageLoader>` exibido durante carregamento de chunks

### PWA e meta tags

#### `index.html`
- `<meta name="description">` adicionado
- `<meta name="theme-color">` para barra de status do navegador
- Tags Apple PWA: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-mobile-web-app-title`
- `<link rel="apple-touch-icon">` apontando para `/icons/logo.png`
- Tags Open Graph: `og:title`, `og:description`, `og:type`, `og:image`

### Tratamento de erros

#### `src/components/ErrorBoundary.tsx` *(novo)*
- Componente de classe `ErrorBoundary` que captura erros de runtime em qualquer rota
- Exibe mensagem amigável ("Algo deu errado") com botão "Recarregar" em vez de tela branca

### Acessibilidade

#### `src/pages/ItemDetailPage.tsx`
- Lightbox: `role="dialog"` e `aria-modal="true"` no container
- Botões de fechar/navegar com `aria-label` ("Fechar galeria", "Imagem anterior", "Próxima imagem")
- Imagem do lightbox com `alt` descritivo (`Foto N de N`)
- Indicadores convertidos de `<div>` para `<button>` com `aria-label` e `aria-current`

#### `src/pages/CategoriesPage.tsx`
- `loading="lazy"` adicionado nas imagens de categoria

---

## [2026-03-30] Melhorias de UI e usabilidade

### Contexto
Ajustes visuais no mobile, performance de navegação, lightbox de imagens e remoção de valores monetários do carrinho.

### Categorias circulares menores no mobile

#### `src/pages/HomePage.tsx`
- Círculos de categoria: `w-10 h-10` no mobile, `sm:w-16 sm:h-16` no desktop (40 → 64px)
- Gap e tamanho do texto reduzidos proporcionalmente

### Prefetch de dados ao hover/touch

#### `src/pages/HomePage.tsx`
- `ItemCarousel` recebe prop `onPrefetch`
- Desktop: `onMouseEnter` no card dispara `queryClient.prefetchQuery` com `staleTime` de 5 min
- Mobile: `onTouchStart` dispara o prefetch antes do tap completar
- Dados do item ficam em cache antes do usuário navegar para a página de detalhe

### Lightbox de imagem

#### `src/pages/ItemDetailPage.tsx`
- Novo componente `Lightbox`: ao clicar na imagem do carrossel, expande para tela cheia com fundo escuro
- Suporte a swipe (mobile), setas de navegação e teclado (←, →, Esc)
- Cursor `zoom-in` no carrossel para sinalizar a ação
- Indicadores de ponto para navegar entre fotos

### Carrinho sem valores monetários

#### `src/pages/CartPage.tsx`
- Removidas colunas e exibições de preço unitário, subtotal, frete e total
- Painel lateral substituído por mensagem informativa: "O valor do aluguel será combinado diretamente com a equipe Bete Atelier"
- Coluna de produto expandida de `col-span-6` para `col-span-8`

---

## [2026-03-30] Configuração de PWA e favicon

### Contexto
Correção da configuração de PWA que impedia a instalação do app.

### Arquivos modificados

#### `vite.config.ts`
- Ícones do manifest corrigidos para apontar para `/icons/logo.png` (192×192)
- `includeAssets` atualizado para refletir o arquivo existente
- `name` do manifest atualizado para `Bete Atelier`

#### `index.html`
- `<link rel="icon">` alterado de `vite.svg` para `/icons/logo.png`

---

## [2026-03-28] Edição e Exclusão de Itens (Master Admin)

### Contexto
Funcionalidade de edição e exclusão de itens acessível apenas para usuários `isMaster`, diretamente nos cards da homepage — sem precisar entrar na página de detalhe.

### Arquivos criados

#### `src/hooks/useDeleteItem.ts`
Hook de exclusão de item. Chama `DELETE /items/:id` e invalida o cache de `['items']`.

#### `src/hooks/useUpdateItem.ts`
Hook de atualização de item. Chama `PUT /items/:id` com os campos editáveis e faz upload sequencial de novas imagens via `POST /items/:id/image`. Invalida `['items']` e `['item', id]`.

#### `src/pages/EditItemPage.tsx`
Página de edição de peça, acessível em `/itens/:itemId/editar`. Baseada na `AddItemPage` com as seguintes diferenças:
- Carrega os dados existentes do item via `useItem(itemId)` e preenche os campos automaticamente
- Imagens já salvas exibidas nos slots com botão de remoção individual (chama `DELETE /items/:id/images/:imageId` diretamente)
- Slots vazios restantes (até o limite de 4) permitem adicionar novas imagens, enviadas ao salvar
- Tamanhos/estoque editados diretamente via `useAddItemStock`, `useUpdateItemStock`, `useDeleteItemStock` — sem precisar salvar o formulário
- Botão "SALVAR ALTERAÇÕES" atualiza apenas os campos de texto/categoria/cor/preço/ativo

### Arquivos modificados

#### `src/pages/HomePage.tsx`
- Importa `useDeleteItem`, `Pencil`, `Trash2`, `AlertTriangle`
- `ItemCarousel` recebe novas props: `isMaster`, `onEdit`, `onDelete`
- Quando `isMaster`, dois botões circulares aparecem sobrepostos no canto superior direito da imagem:
  - **Pencil** → navega para `/itens/:id/editar`
  - **Trash2** → primeiro toque muda para vermelho (confirmação por 3s); segundo toque confirma exclusão
- O toque normal na imagem navega para `ItemDetailPage` (apenas quando não é master)
- O toque no nome/cor abaixo da imagem sempre navega para `ItemDetailPage`

#### `src/App.tsx`
- Importa `EditItemPage`
- Adiciona rota protegida `/itens/:itemId/editar` dentro de `AdminRoute`

### Fluxo completo

```
Homepage (isMaster)
  └── card do item
        ├── [toque no nome/cor]  → ItemDetailPage  (leitura)
        ├── [ícone Pencil]       → EditItemPage     (edição)
        └── [ícone Trash2]
              ├── 1º toque → confirmar (vermelho, 3s timeout)
              └── 2º toque → DELETE /items/:id → remove da lista
```

---

## [2026-03-28] Múltiplas Imagens por Item + Carrossel

### Contexto
Suporte a até 4 imagens por item, com carrossel por swipe na homepage e na página de detalhe.

### Arquivos modificados

#### `src/hooks/useCreateItem.ts`
- `image: File` substituído por `images: File[]`
- Upload sequencial de cada arquivo para `POST /items/:id/image`

#### `src/pages/AddItemPage.tsx`
- Área de imagem substituída por grade 2×2 com 4 slots
- Slot "Capa" é obrigatório; slots seguintes só habilitam quando o anterior tem imagem
- Cada slot tem botão de remoção independente

#### `src/pages/HomePage.tsx`
- Componente `ItemCarousel` substitui o card simples
- Suporta swipe por touch (delta mínimo 30px)
- Indicadores de ponto no rodapé quando há mais de uma imagem

#### `src/pages/ItemDetailPage.tsx`
- `ImageCarousel` com swipe e indicadores de ponto, full-width

---

## [2026-03-28] Página de Detalhe do Item

### Contexto
Implementação da `ItemDetailPage` seguindo o layout de referência do Figma.

### Arquivos criados/modificados

#### `src/pages/ItemDetailPage.tsx`
- Header com fundo branco, botão voltar e logo centralizado
- Imagem full-width com proporção `1/1`, `object-top`
- Nome em maiúsculo bold + badge "Disponível para alugar" / "Indisponível"
- Seção de cor com círculo colorido
- Chips de tamanhos (apenas `stocks` com `available: true`)
- Seção de descrição (condicional)
- Botão "ADICIONAR AO CARRINHO" / "VER NO CARRINHO"

---

## [2026-03-28] Header Sticky na Homepage

### Contexto
Header (fundo escuro + logo + busca + categorias) fixo ao scroll.

### Arquivos modificados

#### `src/pages/HomePage.tsx`
- Bloco sticky `top-0 z-30 relative` agrupa header escuro, logo, botão admin, busca e categorias
- `overflow-x-hidden` movido para o container do conteúdo scrollável (grid + paginação) — necessário pois `overflow` no pai quebra `sticky`
- Visual original preservado: barra de busca sobreposta ao limite entre header escuro e fundo branco (`paddingTop: 164px`)

---

## [2026-03-28] Filtro de Tamanhos — correção stocks

### Contexto
O backend retorna `stocks: ItemStock[]` (cada um com `.size.size`). O campo `sizes` foi removido do tipo `Item`.

### Arquivos modificados

#### `src/pages/HomePage.tsx`
- `filterSizes`: `i.sizes?.map(s => s.size)` → `i.stocks?.map(s => s.size.size)`
- `filteredItems`: `i.sizes?.some(...)` → `i.stocks?.some(s => selectedSizes.includes(s.size.size))`
- `MOCK_ITEMS`: `sizes: []` → `stocks: []`
