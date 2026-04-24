import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { apiGet } from '@/api/client'
import {
  Search, SlidersHorizontal, ShoppingBag,
  ChevronLeft, ChevronRight, Sparkles, X, ChevronUp, LogIn, LogOut,
  Pencil, Trash2, Calendar, Plus, CheckCircle2, Clock
} from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useItems } from '@/hooks/useItems'
import { useDeleteItem } from '@/hooks/useDeleteItem'
import { useReservations } from '@/hooks/useReservations'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
import type { Category, Item } from '@/types'
import { getColorInfo } from '@/utils/colors'
import CategoryFormModal from '@/components/CategoryFormModal'

// ─── Constants ───────────────────────────────────────────────────────────────


const FILTER_SORT = ['Novidades']

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (currentPage > 3) pages.push('...')
  for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i)
  if (currentPage < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
}

// ─── Item Card com carrossel ──────────────────────────────────────────────────

function ItemCarousel({ item, onClick, onPrefetch, isMaster, onEdit, onDelete, isReserved }: {
  item: Item
  onClick: () => void
  onPrefetch?: () => void
  isMaster?: boolean
  onEdit?: () => void
  onDelete?: () => void
  isReserved?: boolean
}) {
  const images = item.images ?? []
  const [index, setIndex] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const touchStartX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    onPrefetch?.()
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) < 30) return
    if (delta > 0) setIndex((i) => Math.min(i + 1, images.length - 1))
    else setIndex((i) => Math.max(i - 1, 0))
    touchStartX.current = null
  }

  return (
    <div className="flex flex-col" style={{ gap: '12px' }}>
      {/* Imagem com carrossel */}
      <div
        className="w-full overflow-hidden flex-shrink-0 relative"
        style={{ aspectRatio: '160/232', borderRadius: '2px', boxShadow: '4px 0px 6px 0px rgba(0,0,0,0.64)' }}
        onMouseEnter={onPrefetch}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={onClick}
      >
        {images.length > 0 ? (
          <>
            <img
              src={images[index].url}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            {images.length > 1 && (
              <div
                className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
                style={{ gap: '4px', padding: '6px 0', background: 'linear-gradient(to top, rgba(0,0,0,0.28), transparent)' }}
              >
                {images.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === index ? '6px' : '4px',
                      height: i === index ? '6px' : '4px',
                      borderRadius: '50%',
                      background: i === index ? 'white' : 'rgba(255,255,255,0.5)',
                      transition: 'all 0.2s',
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Sparkles style={{ width: '24px', height: '24px', color: '#D1D5DB' }} />
          </div>
        )}

        {/* Botões master sobrepostos */}
        {isMaster && (
          <div
            className="absolute top-0 right-0 flex flex-col"
            style={{ gap: '4px', padding: '6px' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.() }}
              className="flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              <Pencil style={{ width: '13px', height: '13px', color: '#292D32' }} />
            </button>

            {confirmDelete ? (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete?.(); setConfirmDelete(false) }}
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(220,38,38,0.9)', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              >
                <Trash2 style={{ width: '13px', height: '13px', color: 'white' }} />
              </button>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); setTimeout(() => setConfirmDelete(false), 3000) }}
                className="flex items-center justify-center hover:opacity-80 transition-opacity"
                style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
              >
                <Trash2 style={{ width: '13px', height: '13px', color: '#DC2626' }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Info — clicável para navegar */}
      <button
        onClick={onClick}
        className="flex flex-col text-left active:scale-95 transition-transform w-full"
        style={{ gap: '8px', padding: '0 4px', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <span
          style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: 400, letterSpacing: '0.04em', lineHeight: '1.333em', color: '#000000', minHeight: 'calc(1.333em * 2)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          className="w-full"
        >
          {item.name}
        </span>
        <div className="flex items-center flex-wrap" style={{ gap: '6px' }}>
          {item.color && (() => {
            const { fill, border, label } = getColorInfo(item.color)
            return (
              <>
                <div className="flex items-center flex-shrink-0" style={{ gap: '4px', padding: '3px 8px', borderRadius: '2px', border: '1px solid #E5E5E5' }}>
                  <div
                    className="rounded-full flex-shrink-0"
                    style={{ width: '10px', height: '10px', background: fill, border: `0.5px solid ${border}`, boxShadow: '1px 1px 2px 0px rgba(0,0,0,0.25)' }}
                  />
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontWeight: 400, letterSpacing: '0.02em', color: '#000000', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
              </>
            )
          })()}
          {isReserved ? (
            <div className="flex items-center flex-shrink-0" style={{ gap: '4px', padding: '3px 8px', borderRadius: '2px', border: '1px solid #E5E5E5', background: 'transparent' }}>
              <Clock style={{ width: '11px', height: '11px', color: '#D97706', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontWeight: 500, color: '#D97706', whiteSpace: 'nowrap' }}>
                Locado
              </span>
            </div>
          ) : (
            <div className="flex items-center flex-shrink-0" style={{ gap: '4px', padding: '3px 8px', borderRadius: '2px', border: '1px solid #E5E5E5', background: 'transparent' }}>
              <CheckCircle2 style={{ width: '11px', height: '11px', color: '#489600', flexShrink: 0 }} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', fontWeight: 500, color: '#489600', whiteSpace: 'nowrap' }}>
                Disponível
              </span>
            </div>
          )}
        </div>
      </button>
    </div>
  )
}

// ─── Filter Section ───────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: '24px' }}>
      {/* Header row */}
      <div className="flex flex-col" style={{ gap: '12px' }}>
        <div className="flex items-center justify-between">
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: '20px',
              lineHeight: '1.333em',
              color: '#292D32',
            }}
          >
            {title}
          </span>
          <ChevronUp style={{ width: '24px', height: '24px', color: '#292D32', flexShrink: 0 }} />
        </div>
        {/* Divider */}
        <div style={{ height: '0.5px', background: '#B5B5B5', width: '100%' }} />
      </div>
      {children}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cartCount = useCartStore((state) => state.items.length)
  const isMaster = useUserStore((state) => state.isMaster)
  const isAuthenticated = useUserStore((state) => state.isAuthenticated)
  const logout = useUserStore((state) => state.logout)
  const { data: reservations } = useReservations(isAuthenticated)
  const pendingCount = isAuthenticated
    ? (reservations ?? []).filter((r) => {
        const s = String(r.status ?? '').toUpperCase()
        return s === 'PENDING_APPROVAL' || s === 'PENDING'
      }).length
    : 0
  const { mutate: deleteItem } = useDeleteItem()
  const deleteCategory = useDeleteCategory()

  const [searchFocused, setSearchFocused] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmDeleteItemId, setConfirmDeleteItemId] = useState<string | null>(null)
  const [confirmDeleteCategoryId, setConfirmDeleteCategoryId] = useState<string | null>(null)
  const [deleteCategoryError, setDeleteCategoryError] = useState<string | null>(null)

  const itemsPerPage = 12

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter state
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<string | null>(null)

  const { data: apiCategories } = useCategories()
  const { data: apiItems, isLoading } = useItems(activeCategoryId)

  const categories = apiCategories?.length ? apiCategories : []
  const rawItems = apiItems?.length ? apiItems : []

  const searchSuggestions = useMemo(() => {
    if (!search.trim()) return []
    const q = search.toLowerCase()
    return rawItems.filter((i) => i.active && (i.reservations?.length ?? 0) === 0 && i.name.toLowerCase().includes(q)).slice(0, 6)
  }, [rawItems, search])


  const filteredItems = useMemo(() => {
    let items = rawItems.filter((i) => i.active)

    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((i) => i.name.toLowerCase().includes(q))
    }
    if (selectedColors.length > 0) {
      items = items.filter((i) => i.color && selectedColors.includes(i.color))
    }
    if (selectedSizes.length > 0) {
      items = items.filter((i) => i.stocks?.some((st) => selectedSizes.includes(st.size.size)))
    }
    if (sortBy === 'Novidades') {
      items = [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return items
  }, [rawItems, search, selectedColors, selectedSizes, sortBy])

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  function handleCategoryClick(id: string) {
    setActiveCategoryId((prev) => (prev === id ? undefined : id))
    setCurrentPage(1)
  }

  function toggleColor(color: string) {
    setSelectedColors((prev) =>
      prev.includes(color) ? prev.filter((c) => c !== color) : [...prev, color],
    )
    setCurrentPage(1)
  }

  function toggleSize(size: string) {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    )
    setCurrentPage(1)
  }

  const activeFilterCount = selectedColors.length + selectedSizes.length + (sortBy ? 1 : 0)

  // Cores e tamanhos únicos vindos dos itens do banco
  const filterColors = useMemo(
    () => [...new Set(rawItems.map((i) => i.color).filter(Boolean) as string[])].sort(),
    [rawItems],
  )

  const filterSizes = useMemo(
    () => [...new Set(rawItems.flatMap((i) => i.stocks?.map((st) => st.size.size) ?? []))].sort(),
    [rawItems],
  )

  return (
    <div className="min-h-dvh bg-white relative overflow-x-clip flex flex-col">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 bg-[#242424] flex items-center justify-center" style={{ height: '184px', flexShrink: 0 }}>
        {/* Admin/logout button */}
        <button
          onClick={() => isAuthenticated ? (logout(), navigate('/')) : navigate('/login')}
          className="absolute flex items-center justify-center text-white/60 hover:text-white transition-colors"
          style={{ left: '56px', top: '76px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          title={isAuthenticated ? 'Sair' : 'Acesso admin'}
        >
          {isAuthenticated
            ? <LogOut style={{ width: '22px', height: '22px' }} />
            : <LogIn style={{ width: '22px', height: '22px' }} />
          }
        </button>

        {/* Logo */}
        <img
          src="/images/logo.png"
          alt=""
          aria-hidden
          className="object-cover object-top"
          style={{ width: '95px', height: '90px' }}
        />
      </header>

      {/* ── Sticky: Search + Categories ── */}
      <div
        className="sticky z-20 bg-white flex flex-col lg:mr-[min(509px,90vw)]"
        style={{ top: '184px', paddingTop: '20px', paddingBottom: '20px', paddingLeft: '55px', paddingRight: '55px', gap: '24px', borderBottom: '1px solid #E5E5E5' }}
      >
        {/* Search bar row */}
        <div className="flex items-center" style={{ gap: '8px' }}>
          <div ref={searchRef} className="relative flex-1" style={{ minWidth: 0 }}>
            <div
              className="flex items-center bg-white"
              style={{ height: '40px', padding: '0 16px', gap: '12px', border: '1px solid #E5E5E5', borderRadius: '2px', boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.24)' }}
            >
              <Search style={{ width: '20px', height: '20px', color: '#5D5D5D', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="BUSCAR"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', lineHeight: '1.333em', color: '#5D5D5D' }}
                className="flex-1 bg-transparent outline-none placeholder-[#5D5D5D] min-w-0"
              />
              {search && (
                <button onClick={() => { setSearch(''); setCurrentPage(1) }}>
                  <X style={{ width: '16px', height: '16px', color: '#9CA3AF' }} />
                </button>
              )}
            </div>

            {/* Search dropdown */}
            {searchFocused && searchSuggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 bg-white z-50 overflow-hidden"
                style={{ top: '44px', border: '1px solid #E5E5E5', borderRadius: '2px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
              >
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', color: '#9CA3AF', padding: '10px 16px 6px' }}>
                  Encontramos {filteredItems.length} {filteredItems.length === 1 ? 'opção' : 'opções'} de{' '}
                  <strong style={{ color: '#5D5D5D' }}>"{search}"</strong> para você
                </p>
                <div className="flex overflow-x-auto" style={{ gap: '12px', padding: '8px 16px 12px', scrollbarWidth: 'none' }}>
                  {searchSuggestions.map((item) => (
                    <button
                      key={item.id}
                      onMouseDown={() => { navigate(`/itens/${item.id}`); setSearchFocused(false) }}
                      className="flex flex-col items-center flex-shrink-0 active:scale-95 transition-transform"
                      style={{ width: '80px', gap: '6px' }}
                    >
                      <div
                        className="w-full overflow-hidden bg-gray-50"
                        style={{ aspectRatio: '1/1', borderRadius: '2px', border: '1px solid #E5E5E5' }}
                      >
                        {item.images?.[0] ? (
                          <img
                            src={item.images[0].url}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover object-top"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles style={{ width: '16px', height: '16px', color: '#D1D5DB' }} />
                          </div>
                        )}
                      </div>
                      <span
                        style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', color: '#5D5D5D', lineHeight: '1.3' }}
                        className="text-center w-full truncate"
                      >
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className="relative flex items-center justify-center bg-white flex-shrink-0 lg:hidden"
            style={{ width: '40px', height: '40px', border: '1px solid #E5E5E5', borderRadius: '4px', boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.24)' }}
          >
            <SlidersHorizontal style={{ width: '20px', height: '20px', color: '#5D5D5D' }} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          {isAuthenticated && (
            <button
              onClick={() => navigate('/agenda')}
              className="relative flex items-center justify-center bg-white flex-shrink-0"
              style={{ width: '40px', height: '40px', border: '1px solid #E5E5E5', borderRadius: '4px', boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.24)' }}
            >
              <Calendar style={{ width: '20px', height: '20px', color: '#5D5D5D' }} />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => navigate('/carrinho')}
            className="relative flex items-center justify-center bg-white flex-shrink-0"
            style={{ width: '40px', height: '40px', border: '1px solid #E5E5E5', borderRadius: '4px', boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.24)' }}
          >
            <ShoppingBag style={{ width: '20px', height: '20px', color: '#5D5D5D' }} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-black text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Category pills */}
        <div className="flex items-center justify-center flex-wrap" style={{ gap: '16px' }}>
          {/* Add category button */}
          {isMaster && (
            <div className="relative flex flex-col items-center" style={{ width: '56px', gap: '8px' }}>
              <button
                onClick={() => { setEditingCategory(null); setCategoryModalOpen(true) }}
                className="flex flex-col items-center active:scale-95 transition-transform w-full"
                style={{ gap: '8px' }}
              >
                <div
                  className="overflow-hidden rounded-full flex-shrink-0 w-10 h-10 sm:w-16 sm:h-16 flex items-center justify-center"
                  style={{ boxShadow: '3px 0px 8px 0px rgba(0,0,0,0.48)', border: '2px dashed #9CA3AF' }}
                >
                  <Plus style={{ width: '18px', height: '18px', color: '#5D5D5D' }} />
                </div>
                <span
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', fontWeight: 500, letterSpacing: '0.02em', lineHeight: '1.333em', color: '#5D5D5D' }}
                  className="text-center uppercase"
                >
                  Nova
                </span>
              </button>
              {/* Spacer para alinhar com os ícones de editar/deletar dos outros pills */}
              <div style={{ height: '24px' }} />
            </div>
          )}

          {categories.map((cat) => (
            <div key={cat.id} className="relative flex flex-col items-center" style={{ width: '56px', gap: '8px' }}>
              <button
                onClick={() => handleCategoryClick(cat.id)}
                className="flex flex-col items-center active:scale-95 transition-transform w-full"
                style={{ gap: '8px' }}
              >
                <div
                  className="overflow-hidden rounded-full flex-shrink-0 w-10 h-10 sm:w-16 sm:h-16"
                  style={{ boxShadow: '3px 0px 8px 0px rgba(0,0,0,0.48)', outline: activeCategoryId === cat.id ? '2px solid #5D5D5D' : 'none', outlineOffset: '2px' }}
                >
                  <img src={cat.imageUrl || '/images/logo.png'} alt={cat.name} className="w-full h-full object-cover object-top" />
                </div>
                <span
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', fontWeight: 500, letterSpacing: '0.02em', lineHeight: '1.333em', color: activeCategoryId === cat.id ? '#000000' : '#5D5D5D' }}
                  className="text-center uppercase"
                >
                  {cat.name}
                </span>
              </button>

              {/* Edit / Delete — master only, real data only */}
              {isMaster && !!apiCategories?.length && (
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingCategory(cat as Category); setCategoryModalOpen(true) }}
                    className="w-6 h-6 rounded bg-white shadow flex items-center justify-center hover:bg-gray-100 transition-colors"
                    style={{ border: '1px solid #E5E5E5' }}
                    title="Editar"
                  >
                    <Pencil style={{ width: '11px', height: '11px', color: '#5D5D5D' }} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmDeleteCategoryId(cat.id) }}
                    className="w-6 h-6 rounded bg-white shadow flex items-center justify-center hover:bg-red-50 transition-colors"
                    style={{ border: '1px solid #E5E5E5' }}
                    title="Deletar"
                  >
                    <Trash2 style={{ width: '11px', height: '11px', color: '#ef4444' }} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Category form modal */}
      {categoryModalOpen && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setCategoryModalOpen(false)}
        />
      )}

      {/* Delete category confirmation */}
      {confirmDeleteCategoryId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-4"
            style={{ border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#000' }}>
              Deletar categoria?
            </h3>
            {deleteCategoryError ? (
              <p style={{ fontSize: '14px', color: '#ef4444' }}>
                {deleteCategoryError}
              </p>
            ) : (
              <p style={{ fontSize: '14px', color: '#5D5D5D' }}>
                Esta ação não pode ser desfeita.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setConfirmDeleteCategoryId(null); setDeleteCategoryError(null) }}
                className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                style={{ border: '1px solid #E5E5E5', color: '#5D5D5D' }}
              >
                {deleteCategoryError ? 'Fechar' : 'Cancelar'}
              </button>
              {!deleteCategoryError && (
                <button
                  onClick={async () => {
                    try {
                      await deleteCategory.mutateAsync(confirmDeleteCategoryId)
                      setConfirmDeleteCategoryId(null)
                      setDeleteCategoryError(null)
                    } catch {
                      setDeleteCategoryError('Esta categoria possui peças vinculadas. Remova todas as peças desta categoria antes de deletá-la.')
                    }
                  }}
                  disabled={deleteCategory.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-all"
                >
                  {deleteCategory.isPending ? 'Deletando…' : 'Deletar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete item confirmation */}
      {confirmDeleteItemId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 flex flex-col gap-4"
            style={{ border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#000' }}>
              Deletar peça?
            </h3>
            <p style={{ fontSize: '14px', color: '#5D5D5D' }}>
              Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteItemId(null)}
                className="flex-1 py-2.5 rounded-xl text-sm transition-colors"
                style={{ border: '1px solid #E5E5E5', color: '#5D5D5D' }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { deleteItem(confirmDeleteItemId); setConfirmDeleteItemId(null) }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-all"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conteúdo rolável ── */}
      <div
        className="relative flex flex-col flex-1 lg:mr-[min(509px,90vw)]"
        style={{ paddingTop: '24px', paddingLeft: '55px', paddingRight: '55px' }}
      >

        {/* ── Active filter chips ── */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap" style={{ gap: '8px', marginTop: '20px' }}>
            {sortBy && (
              <button
                onClick={() => setSortBy(null)}
                className="flex items-center"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  gap: '6px',
                  border: '1px solid #E5E5E5',
                  borderRadius: '2px',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#292D32',
                  background: 'white',
                }}
              >
                {sortBy}
                <X style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              </button>
            )}
            {selectedColors.map((color) => (
              <button
                key={color}
                onClick={() => toggleColor(color)}
                className="flex items-center"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  gap: '6px',
                  border: '1px solid #E5E5E5',
                  borderRadius: '2px',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#292D32',
                  background: 'white',
                }}
              >
                Cor {getColorInfo(color).label}
                <X style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              </button>
            ))}
            {selectedSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSize(size)}
                className="flex items-center"
                style={{
                  height: '32px',
                  padding: '0 12px',
                  gap: '6px',
                  border: '1px solid #E5E5E5',
                  borderRadius: '2px',
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#292D32',
                  background: 'white',
                }}
              >
                Tamanho {size.split(' ')[0]}
                <X style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}

        {/* ── Frame 42: Items grid ── */}
        <div className="flex-1" style={{ marginTop: '36px' }}>
          {isLoading ? (
            <div
              className="grid [grid-template-columns:repeat(auto-fill,minmax(100px,1fr))] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              style={{ columnGap: '20px', rowGap: '36px' }}
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex flex-col" style={{ gap: '12px' }}>
                  <div
                    className="w-full bg-gray-100 animate-pulse"
                    style={{ aspectRatio: '160/232', borderRadius: '2px' }}
                  />
                  <div className="h-[18px] bg-gray-100 animate-pulse rounded" />
                  <div className="h-3 w-14 bg-gray-100 animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div
              className="grid [grid-template-columns:repeat(auto-fill,minmax(100px,1fr))] md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
              style={{ columnGap: '20px', rowGap: '36px' }}
            >
              {/* ── MASTER: Adicionar peça card ── */}
              {isMaster && (
                <button
                  onClick={() => navigate('/itens/novo')}
                  className="flex flex-col text-left active:scale-95 transition-transform"
                  style={{ gap: '12px' }}
                >
                  <div
                    className="w-full flex items-center justify-center flex-shrink-0"
                    style={{
                      aspectRatio: '160/232',
                      borderRadius: '2px',
                      border: '1px solid #000000',
                      boxShadow: '4px 0px 6px 0px rgba(0,0,0,0.64)',
                      background: 'white',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '96px',
                        fontWeight: 400,
                        color: '#000000',
                        lineHeight: 1,
                        userSelect: 'none',
                      }}
                    >
                      +
                    </span>
                  </div>
                  <div className="flex flex-col" style={{ gap: '8px', padding: '0 4px' }}>
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        color: '#000000',
                      }}
                    >
                      Adicionar peça
                    </span>
                  </div>
                </button>
              )}

              {paginatedItems.length === 0 && !isMaster && (
                <div className="col-span-full flex flex-col items-center justify-center py-24 gap-3">
                  <Sparkles style={{ width: '32px', height: '32px', color: '#D1D5DB' }} />
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', color: '#5D5D5D' }}>
                    Nenhuma peça encontrada
                  </p>
                </div>
              )}

              {paginatedItems.map((item) => (
                <ItemCarousel
                  key={item.id}
                  item={item}
                  onClick={() => navigate(`/itens/${item.id}`)}
                  onPrefetch={() => queryClient.prefetchQuery({
                    queryKey: ['item', item.id],
                    queryFn: () => apiGet<Item>(`/guest/items/${item.id}`),
                    staleTime: 1000 * 60 * 5,
                  })}
                  isMaster={isMaster}
                  onEdit={() => navigate(`/itens/${item.id}/editar`)}
                  onDelete={() => setConfirmDeleteItemId(item.id)}
                  isReserved={(item.reservations?.length ?? 0) > 0}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Frame 63: Pagination ── */}
        {totalPages > 1 && (
          <div
            className="flex items-center justify-center"
            style={{ gap: '24px', marginTop: '36px', marginBottom: '48px' }}
          >
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex items-center justify-center disabled:opacity-30"
              style={{ width: '20px', height: '20px', color: '#5D5D5D' }}
            >
              <ChevronLeft style={{ width: '20px', height: '20px' }} />
            </button>

            <div className="flex items-center" style={{ gap: '6px' }}>
              {getPageNumbers(currentPage, totalPages).map((page, i) =>
                page === '...' ? (
                  <span
                    key={`el-${i}`}
                    className="flex items-center justify-center"
                    style={{
                      width: '26px',
                      height: '28px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '12px',
                      letterSpacing: '0.04em',
                      border: '1px solid #E5E5E5',
                      borderRadius: '1px',
                      boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.24)',
                      color: '#5D5D5D',
                    }}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className="flex items-center justify-center"
                    style={{
                      width: '26px',
                      height: '28px',
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '12px',
                      fontWeight: currentPage === page ? 500 : 400,
                      letterSpacing: '0.04em',
                      border: `1px solid ${currentPage === page ? '#5D5D5D' : '#E5E5E5'}`,
                      borderRadius: '1px',
                      boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.24)',
                      color: currentPage === page ? '#000000' : '#5D5D5D',
                    }}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center disabled:opacity-30"
              style={{ width: '20px', height: '20px', color: '#5D5D5D' }}
            >
              <ChevronRight style={{ width: '20px', height: '20px' }} />
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          Filter Drawer (02_Home_screen_filtros — node 359:457)
          Panel: 509×1194px, slides in from right
          Shadow: -3px 0px 8px rgba(0,0,0,0.48) (reversed for left edge)
      ════════════════════════════════════════════════════════════════════════ */}

      {/* Overlay — mobile only */}
      {filterOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setFilterOpen(false)}
        />
      )}

      {/* Drawer panel — mobile: slide-in drawer / desktop: fixed sidebar */}
      <div
        className={`fixed top-0 right-0 h-dvh bg-white z-50 overflow-y-auto transition-transform duration-300 ease-in-out lg:translate-x-0 lg:top-[184px] lg:h-[calc(100dvh-184px)] lg:z-20 ${filterOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{
          width: 'min(509px, 90vw)',
          boxShadow: '-3px 0px 8px 0px rgba(0,0,0,0.48)',
        }}
      >
        {/* ── Panel header ── */}
        <div className="relative" style={{ height: '152px', flexShrink: 0 }}>
          {/* Close button — x:36, y:120, 32×32px */}
          <button
            onClick={() => setFilterOpen(false)}
            className="absolute flex items-center justify-center lg:hidden"
            style={{
              left: '36px',
              top: '120px',
              width: '32px',
              height: '32px',
              border: '1px solid #E5E5E5',
              borderRadius: '2px',
            }}
          >
            <X style={{ width: '18px', height: '18px', color: '#292D32' }} />
          </button>

          {/* Title "FILTROS" — centered, y:123 */}
          <span
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              top: '123px',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 600,
              fontSize: '20px',
              lineHeight: '1.333em',
              color: '#000000',
              whiteSpace: 'nowrap',
            }}
          >
            FILTROS
          </span>
        </div>

        {/* ── Filter sections — x:36, y:222, width:437, gap:48px ── */}
        <div
          className="flex flex-col"
          style={{ padding: '0 36px 48px 36px', gap: '48px' }}
        >

          {/* Ordenar por */}
          <FilterSection title="Ordenar por">
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              {FILTER_SORT.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setSortBy((prev) => (prev === opt ? null : opt))}
                  style={{
                    height: '36px',
                    padding: '8px 16px',
                    border: `1px solid ${sortBy === opt ? '#292D32' : '#E5E5E5'}`,
                    borderRadius: '2px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: sortBy === opt ? '#292D32' : '#5D5D5D',
                    background: sortBy === opt ? '#F9F9F9' : 'white',
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Cor */}
          <FilterSection title="Cor">
            <div className="flex flex-wrap" style={{ gap: '24px' }}>
              {filterColors.map((name) => {
                const { fill, border, label } = getColorInfo(name)
                return (
                  <button
                    key={name}
                    onClick={() => toggleColor(name)}
                    className="flex flex-col items-center"
                    style={{ gap: '6px' }}
                  >
                    <div
                      className="rounded-full flex-shrink-0"
                      style={{
                        width: '44px',
                        height: '44px',
                        background: fill,
                        border: `1px solid ${border}`,
                        outline: selectedColors.includes(name) ? '2px solid #5D5D5D' : 'none',
                        outlineOffset: '2px',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#5D5D5D',
                      }}
                    >
                      {label}
                    </span>
                  </button>
                )
              })}
            </div>
          </FilterSection>

          {/* Tamanho */}
          <FilterSection title="Tamanho">
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              {filterSizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  style={{
                    width: '96px',
                    height: '36px',
                    padding: '8px 16px',
                    border: `1px solid ${selectedSizes.includes(size) ? '#292D32' : '#E5E5E5'}`,
                    borderRadius: '2px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: selectedSizes.includes(size) ? '#292D32' : '#5D5D5D',
                    background: selectedSizes.includes(size) ? '#F9F9F9' : 'white',
                  }}
                >
                  {size}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Categoria */}
          <FilterSection title="Categoria">
            <div className="flex flex-wrap" style={{ gap: '12px' }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  style={{
                    minWidth: '96px',
                    height: '36px',
                    padding: '8px 16px',
                    border: `1px solid ${activeCategoryId === cat.id ? '#292D32' : '#E5E5E5'}`,
                    borderRadius: '2px',
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '14px',
                    fontWeight: 500,
                    color: activeCategoryId === cat.id ? '#292D32' : '#5D5D5D',
                    background: activeCategoryId === cat.id ? '#F9F9F9' : 'white',
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </FilterSection>

          {/* Limpar filtros (if any active) */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setSelectedColors([])
                setSelectedSizes([])
                setSortBy(null)
              }}
              style={{
                height: '40px',
                border: '1px solid #E5E5E5',
                borderRadius: '2px',
                fontFamily: "'Playfair Display', serif",
                fontSize: '14px',
                fontWeight: 500,
                color: '#5D5D5D',
              }}
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
