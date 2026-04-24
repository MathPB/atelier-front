import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Check,
} from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useItems } from '@/hooks/useItems'
import { useCartStore } from '@/stores/cartStore'
import type { Category, Item } from '@/types'
import { getColorInfo } from '@/utils/colors'

// ─── Constants ───────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 12

type MockCategory = Category & { tint: string }

const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: 'vestidos',
    name: 'Vestidos',
    description: null,
    imageUrl: null,
    createdAt: '',
    updatedAt: '',
    tint: 'bg-transparent',
    _count: { items: 12 },
  },
  {
    id: 'ternos',
    name: 'Ternos',
    description: null,
    imageUrl: null,
    createdAt: '',
    updatedAt: '',
    tint: 'bg-blue-900/60',
    _count: { items: 8 },
  },
  {
    id: 'acessorios',
    name: 'Acessórios',
    description: null,
    imageUrl: null,
    createdAt: '',
    updatedAt: '',
    tint: 'bg-amber-800/60',
    _count: { items: 15 },
  },
  {
    id: 'noivas',
    name: 'Noivas',
    description: null,
    imageUrl: null,
    createdAt: '',
    updatedAt: '',
    tint: 'bg-rose-900/50',
    _count: { items: 6 },
  },
]

const DRESS_NAMES = [
  'Vestido Serenidade',
  'Vestido Aurora',
  'Terno Elegância',
  'Vestido Mistério',
  'Vestido Fantasia',
  'Colar Luxo',
  'Vestido Glamour',
  'Vestido Sonho',
  'Terno Clássico',
  'Vestido Brilho',
  'Bracelete Encanto',
  'Vestido Graça',
]
const COLORS = ['Preto', 'Branco', 'Vermelho', 'Azul', 'Rosa', 'Dourado', 'Prata', 'Verde']

const MOCK_ITEMS: Item[] = Array.from({ length: 12 }, (_, i) => ({
  id: `mock-${i}`,
  name: DRESS_NAMES[i],
  description: null,
  color: COLORS[i % COLORS.length],
  price: 0,
  categoryId: MOCK_CATEGORIES[i % 4].id,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  stocks: [],
  images: [
    {
      id: `img-${i}`,
      itemId: `mock-${i}`,
      url: '/images/vestido.png',
      key: 'vestido.png',
      order: 0,
      createdAt: '',
    },
  ],
}))

const SORT_OPTIONS = [
  { id: 'newest' as const, label: 'Mais recentes' },
  { id: 'az' as const, label: 'Nome A – Z' },
  { id: 'za' as const, label: 'Nome Z – A' },
]
type SortId = (typeof SORT_OPTIONS)[number]['id']

// ─── Component ───────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const navigate = useNavigate()
  const cartCount = useCartStore((state) => state.items.length)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(categoryId)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<SortId>('newest')
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  const { data: apiCategories } = useCategories()
  const { data: apiItems, isLoading } = useItems(activeCategoryId)

  const displayCategories: MockCategory[] = (
    apiCategories?.length ? apiCategories : MOCK_CATEGORIES
  ) as MockCategory[]
  const rawItems = apiItems?.length ? apiItems : MOCK_ITEMS

  // Close sort menu when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategoryId, search, selectedColors, selectedSizes, sortBy])

  const { colors, sizes } = useMemo(() => {
    const colors = [...new Set(rawItems.filter((i) => i.color).map((i) => i.color!))].sort()
    const sizes = [...new Set(rawItems.flatMap((i) => i.stocks?.map((st) => st.size.size) ?? []))].sort()
    return { colors, sizes }
  }, [rawItems])

  const filteredItems = useMemo(() => {
    let items = rawItems.filter((i) => i.active)
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (selectedColors.length) items = items.filter((i) => i.color && selectedColors.includes(i.color))
    if (selectedSizes.length) items = items.filter((i) => i.stocks?.some((st) => selectedSizes.includes(st.size.size)))
    if (sortBy === 'az') items.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    else if (sortBy === 'za') items.sort((a, b) => b.name.localeCompare(a.name, 'pt-BR'))
    return items
  }, [rawItems, search, selectedColors, selectedSizes, sortBy])

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  const paginatedItems = filteredItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
  const activeFilterCount = selectedColors.length + selectedSizes.length

  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages: (number | '...')[] = [1]
    if (currentPage > 3) pages.push('...')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  function handleCategoryChange(catId: string | undefined) {
    setActiveCategoryId(catId)
    setSelectedColors([])
    setSelectedSizes([])
    setSearch('')
  }

  function toggleColor(c: string) {
    setSelectedColors((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))
  }

  function toggleSize(s: string) {
    setSelectedSizes((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]))
  }

  return (
    <div className="relative flex flex-col h-dvh w-full overflow-hidden bg-[#111111]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#4B4B4B]/45 to-[#0A0A0A]/80 pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-5 pt-7 pb-3 flex-shrink-0">
          <button
            onClick={() => navigate('/categorias')}
            className="flex items-center gap-1 text-white/60 hover:text-white transition-colors p-1 -ml-1"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>

          <img src="/images/logo.png" alt="Bete Atelier" className="w-24" />

          <button
            onClick={() => navigate('/carrinho')}
            className="relative text-white/60 hover:text-white transition-colors p-1 -mr-1"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-white text-black rounded-full text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </header>

        {/* ── Frame 51 — Category Tabs ── */}
        <div className="flex-shrink-0 px-5 pb-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="flex gap-2.5 min-w-max">
            {/* "Todas" pill */}
            <button
              onClick={() => handleCategoryChange(undefined)}
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}
              className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-[72px] rounded-xl overflow-hidden transition-all active:scale-95 ${
                activeCategoryId == null
                  ? 'ring-2 ring-white/70'
                  : 'opacity-70 hover:opacity-100'
              }`}
            >
              <div className="w-full h-[52px] bg-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white/60" />
              </div>
              <span
                className={`pb-2 text-[11px] leading-none ${
                  activeCategoryId == null ? 'text-white font-semibold' : 'text-white/60'
                }`}
              >
                Todas
              </span>
            </button>

            {/* Category pills with image */}
            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 w-[72px] rounded-xl overflow-hidden transition-all active:scale-95 ${
                  activeCategoryId === cat.id
                    ? 'ring-2 ring-white/70'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div className="relative w-full h-[52px] overflow-hidden">
                  <img
                    src={cat.imageUrl ?? '/images/vestido.png'}
                    alt={cat.name}
                    className="w-full h-full object-cover object-top"
                  />
                  {(cat as MockCategory).tint && (
                    <div className={`absolute inset-0 ${(cat as MockCategory).tint}`} />
                  )}
                </div>
                <span
                  className={`pb-2 text-[11px] leading-none text-center px-1 truncate w-full ${
                    activeCategoryId === cat.id ? 'text-white font-semibold' : 'text-white/60'
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Toolbar: Search + Sort + Filter ── */}
        <div className="flex-shrink-0 flex items-center gap-2 px-5 pb-3">
          {/* Search */}
          <div
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.07]"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <Search className="w-4 h-4 text-white/40 flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar peças..."
              className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none min-w-0"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-white/30 hover:text-white/60 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative flex-shrink-0" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu((p) => !p)}
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
                showSortMenu
                  ? 'bg-white/20 text-white'
                  : 'bg-white/[0.07] text-white/70 hover:bg-white/[0.13]'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">Ordenar</span>
            </button>

            {showSortMenu && (
              <div
                className="absolute right-0 top-full mt-1.5 w-44 rounded-xl overflow-hidden z-50"
                style={{
                  background: 'rgba(20,20,20,0.95)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(32px)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortBy(opt.id)
                      setShowSortMenu(false)
                    }}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm text-left transition-colors hover:bg-white/10"
                  >
                    <span className={sortBy === opt.id ? 'text-white font-medium' : 'text-white/60'}>
                      {opt.label}
                    </span>
                    {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Filter */}
          <button
            onClick={() => setFiltersOpen((p) => !p)}
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-white/20 text-white'
                : 'bg-white/[0.07] text-white/70 hover:bg-white/[0.13]'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtrar</span>
            {activeFilterCount > 0 && (
              <span className="bg-white text-black rounded-full w-4 h-4 text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* ── Body: [sidebar] + [grid + pagination] ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Filter Sidebar */}
          {filtersOpen && (
            <aside
              className="w-56 flex-shrink-0 flex flex-col bg-black/50 overflow-y-auto"
              style={{
                borderRight: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(32px)',
              }}
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <h3
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-white text-base"
                >
                  Filtros
                </h3>
                <button
                  onClick={() => setFiltersOpen(false)}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {colors.length > 0 && (
                <div className="px-4 mb-5">
                  <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-2.5">Cor</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {colors.map((c) => {
                      const { fill, border, label } = getColorInfo(c)
                      return (
                        <button
                          key={c}
                          onClick={() => toggleColor(c)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all ${
                            selectedColors.includes(c)
                              ? 'bg-white text-black font-medium'
                              : 'bg-white/[0.08] text-white/60 border border-white/10 hover:bg-white/15'
                          }`}
                        >
                          <span
                            className="rounded-full flex-shrink-0"
                            style={{ width: 10, height: 10, background: fill, border: `1px solid ${border}` }}
                          />
                          {label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="px-4 mb-5">
                  <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-2.5">Tamanho</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`px-2.5 py-1 rounded text-xs transition-all ${
                          selectedSizes.includes(s)
                            ? 'bg-white text-black font-medium'
                            : 'bg-white/[0.08] text-white/60 border border-white/10 hover:bg-white/15'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeFilterCount > 0 && (
                <div className="px-4 mt-auto pb-4">
                  <button
                    onClick={() => {
                      setSelectedColors([])
                      setSelectedSizes([])
                    }}
                    className="text-white/35 text-xs hover:text-white/60 transition-colors underline underline-offset-2"
                  >
                    Limpar filtros
                  </button>
                </div>
              )}
            </aside>
          )}

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Results count */}
            <div className="flex-shrink-0 px-5 pb-1">
              <span className="text-white/25 text-xs">
                {filteredItems.length} {filteredItems.length === 1 ? 'peça' : 'peças'}
              </span>
            </div>

            {/* ── Frame 42 — Items Grid ── */}
            <div className="flex-1 overflow-y-auto px-5 pb-2">
              {isLoading ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : paginatedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 pb-16">
                  <Sparkles className="w-10 h-10 text-white/15" />
                  <p className="text-white/30 text-sm">Nenhuma peça encontrada</p>
                  {(search || activeFilterCount > 0) && (
                    <button
                      onClick={() => {
                        setSearch('')
                        setSelectedColors([])
                        setSelectedSizes([])
                      }}
                      className="text-white/40 text-xs hover:text-white/60 underline underline-offset-2 transition-colors"
                    >
                      Limpar busca e filtros
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {paginatedItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => navigate(`/itens/${item.id}`)}
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}
                      className="flex flex-col overflow-hidden rounded-xl bg-white/[0.05] text-left active:scale-95 transition-all hover:bg-white/[0.09]"
                    >
                      <div className="aspect-[3/4] w-full overflow-hidden bg-white/[0.04]">
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0].url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-white/15" />
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p
                          style={{ fontFamily: "'Playfair Display', serif" }}
                          className="text-white text-[13px] font-medium truncate leading-snug"
                        >
                          {item.name}
                        </p>
                        {(item.stocks?.length || item.color) && (
                          <p className="text-white/35 text-[11px] mt-0.5 truncate">
                            {[
                              item.stocks?.length ? item.stocks.map((st) => st.size.size).join(', ') : null,
                              item.color ? getColorInfo(item.color).label : null,
                            ].filter(Boolean).join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Frame 63 — Pagination ── */}
            {totalPages > 1 && (
              <div className="flex-shrink-0 flex items-center justify-center gap-1 py-3">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getPageNumbers().map((page, i) =>
                  page === '...' ? (
                    <span key={`el-${i}`} className="w-7 text-center text-white/30 text-sm select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded text-sm transition-all ${
                        currentPage === page
                          ? 'bg-white text-black font-semibold'
                          : 'text-white/50 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-white/40 hover:text-white disabled:opacity-20 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
