import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useDeleteCategory } from '@/hooks/useDeleteCategory'
import { useUserStore } from '@/stores/userStore'
import { getCategoryIcon } from '@/utils/categoryIcons'
import { apiGet } from '@/api/client'
import CategoryFormModal from '@/components/CategoryFormModal'
import type { Category, Item } from '@/types'

export default function CategoriesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: apiCategories, isLoading } = useCategories()
  const isMaster = useUserStore((s) => s.isMaster)
  const deleteCategory = useDeleteCategory()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  function prefetchItems(categoryId: string) {
    queryClient.prefetchQuery({
      queryKey: ['items', categoryId],
      queryFn: () => apiGet<Item[]>(`/guest/items?categoryId=${categoryId}`),
    })
  }

  function handleOpenCreate() {
    setEditingCategory(null)
    setModalOpen(true)
  }

  function handleOpenEdit(e: React.MouseEvent, category: Category) {
    e.stopPropagation()
    setEditingCategory(category)
    setModalOpen(true)
  }

  function handleDeleteClick(e: React.MouseEvent, categoryId: string) {
    e.stopPropagation()
    setConfirmDeleteId(categoryId)
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteId) return
    await deleteCategory.mutateAsync(confirmDeleteId)
    setConfirmDeleteId(null)
  }

  const displayCategories = apiCategories ?? []

  return (
    <div className="relative min-h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 bg-[#111111]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#4B4B4B]/60 to-[#0A0A0A]/90" />

      <div className="relative z-10 flex flex-col min-h-dvh">
        {/* Header */}
        <header className="flex items-center justify-center pt-12 pb-6">
          <img src="/images/logo.png" alt="Bete Atelier" className="w-36" />
        </header>

        {/* Title */}
        <div className="text-center mb-10 px-6">
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-white text-3xl font-medium tracking-wide"
          >
            Categorias
          </h1>
          <p className="text-white/40 text-sm mt-2">Selecione uma categoria para explorar</p>
        </div>

        {/* Categories Grid */}
        <main className="flex-1 px-8 pb-16">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-44 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {/* Add category button — only for authenticated users */}
              {isMaster && (
                <button
                  onClick={handleOpenCreate}
                  style={{ border: '1px dashed rgba(255,255,255,0.20)' }}
                  className="relative flex flex-col items-center justify-center h-44 rounded-xl text-white/40 hover:text-white/70 hover:border-white/40 transition-all active:scale-95 gap-2"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-sm">Nova categoria</span>
                </button>
              )}

              {displayCategories.map((category) => (
                <div key={category.id} className="relative group">
                  <button
                    onMouseEnter={() => prefetchItems(category.id)}
                    onClick={() => navigate(`/categorias/${category.id}/itens`)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.10)',
                      boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                    }}
                    className="relative flex flex-col overflow-hidden h-44 w-full text-white rounded-xl transition-all active:scale-95 hover:brightness-110"
                  >
                    {/* Background image */}
                    <img
                      src={category.imageUrl ?? '/images/vestido.png'}
                      alt={category.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-top"
                    />
                    {/* Dark gradient for legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center justify-end h-full pb-5 gap-1.5 px-3">
                      {getCategoryIcon(category.name, 'w-6 h-6 opacity-80')}
                      <span
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        className="text-base font-medium text-center leading-snug"
                      >
                        {category.name}
                      </span>
                      {category._count != null && (
                        <span className="text-white/50 text-xs">
                          {category._count.items} {category._count.items === 1 ? 'peça' : 'peças'}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Edit / Delete buttons — master only */}
                  {isMaster && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      <button
                        onClick={(e) => handleOpenEdit(e, category)}
                        className="w-7 h-7 rounded-lg bg-black/60 text-white/70 hover:text-white hover:bg-black/80 flex items-center justify-center transition-colors backdrop-blur-sm"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(e, category.id)}
                        className="w-7 h-7 rounded-lg bg-black/60 text-rose-400/70 hover:text-rose-400 hover:bg-black/80 flex items-center justify-center transition-colors backdrop-blur-sm"
                        title="Deletar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Category form modal */}
      {modalOpen && (
        <CategoryFormModal
          category={editingCategory}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#1a1a1a] p-6 flex flex-col gap-4"
            style={{ border: '1px solid rgba(255,255,255,0.10)' }}
          >
            <h3
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-white text-lg"
            >
              Deletar categoria?
            </h3>
            <p className="text-white/50 text-sm">
              Esta ação não pode ser desfeita. Categorias com peças vinculadas não podem ser deletadas.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/[0.07] text-white/60 text-sm hover:bg-white/[0.12] transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteCategory.isPending}
                className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 disabled:opacity-50 transition-all"
              >
                {deleteCategory.isPending ? 'Deletando…' : 'Deletar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
