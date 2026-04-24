import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ImagePlus, X, Loader2, Plus, Pencil, Check, Trash2, Settings2, Sparkles, Images } from 'lucide-react'
import { useItem } from '@/hooks/useItems'
import { useUpdateItem } from '@/hooks/useUpdateItem'
import { useCategories } from '@/hooks/useCategories'
import {
  useCategorySizes,
  useAddCategorySize,
  useUpdateCategorySize,
  useDeleteCategorySize,
} from '@/hooks/useCategorySizes'
import {
  useAddItemStock,
  useUpdateItemStock,
  useDeleteItemStock,
} from '@/hooks/useItemStock'
import { apiDelete } from '@/api/client'
import { useQueryClient } from '@tanstack/react-query'
import { COLOR_OPTIONS } from '@/utils/colors'
import type { ItemStock } from '@/types'

// ─── Estilos compartilhados ───────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: '14px',
  fontWeight: 400,
  color: '#292D32',
  height: '40px',
  padding: '0 12px',
  border: '1px solid #E5E5E5',
  borderRadius: '2px',
  outline: 'none',
  width: '100%',
  background: 'white',
  boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  cursor: 'pointer',
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: '11px', letterSpacing: '0.08em', color: '#5D5D5D', textTransform: 'uppercase' }}>
      {children}
    </span>
  )
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="flex flex-col" style={{ gap: '7px', ...style }}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap" style={{ gap: '8px' }}>
      <button
        type="button"
        onClick={() => onChange('')}
        title="Sem cor"
        className="flex items-center justify-center transition-all hover:opacity-80"
        style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: 'white',
          border: value === '' ? '2px solid #292D32' : '1px solid #D0D0D0',
          boxShadow: value === '' ? '0 0 0 2px rgba(41,45,50,0.15)' : 'none',
          flexShrink: 0,
          fontSize: '10px', color: '#B5B5B5',
        }}
      >
        ✕
      </button>
      {COLOR_OPTIONS.map((c) => (
        <button
          key={c.value}
          type="button"
          onClick={() => onChange(c.value)}
          title={c.label}
          className="transition-all hover:scale-110"
          style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: c.fill,
            border: value === c.value ? '2px solid #292D32' : `1px solid ${c.border}`,
            boxShadow: value === c.value ? '0 0 0 2px rgba(41,45,50,0.15)' : '1px 1px 2px rgba(0,0,0,0.15)',
            flexShrink: 0,
            cursor: 'pointer',
          }}
        />
      ))}
    </div>
  )
}

// ─── Editor do catálogo de tamanhos da categoria ──────────────────────────────

function CatalogSizeEditor({ categoryId, onClose }: { categoryId: string; onClose: () => void }) {
  const { data: sizes = [], isLoading } = useCategorySizes(categoryId)
  const addSize = useAddCategorySize(categoryId)
  const updateSize = useUpdateCategorySize(categoryId)
  const deleteSize = useDeleteCategorySize(categoryId)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')

  function handleAdd() {
    const trimmed = newName.trim()
    if (!trimmed) return
    addSize.mutate(trimmed, { onSuccess: () => setNewName('') })
  }

  function commitEdit(id: string) {
    const trimmed = editingValue.trim()
    if (!trimmed) return
    updateSize.mutate({ sizeId: id, size: trimmed }, { onSuccess: () => setEditingId(null) })
  }

  return (
    <div style={{ border: '1px solid #E5E5E5', borderRadius: '2px', padding: '12px', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div className="flex items-center justify-between">
        <Label>Tamanhos da categoria</Label>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <X style={{ width: '13px', height: '13px', color: '#B5B5B5' }} />
        </button>
      </div>

      {isLoading && <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#B5B5B5' }}>Carregando...</span>}
      {!isLoading && sizes.length === 0 && (
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#B5B5B5' }}>Nenhum tamanho cadastrado.</span>
      )}

      {sizes.map((s) => (
        <div key={s.id} className="flex items-center justify-between" style={{ height: '32px', padding: '0 8px', border: '1px solid #E5E5E5', borderRadius: '2px', background: 'white' }}>
          {editingId === s.id ? (
            <input
              autoFocus
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(s.id); if (e.key === 'Escape') setEditingId(null) }}
              style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#292D32', border: 'none', outline: 'none', background: 'transparent', flex: 1, padding: 0 }}
            />
          ) : (
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#292D32', fontWeight: 500 }}>{s.size}</span>
          )}
          <div className="flex items-center" style={{ gap: '8px' }}>
            {editingId === s.id ? (
              <button type="button" onClick={() => commitEdit(s.id)} disabled={updateSize.isPending} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Check style={{ width: '13px', height: '13px', color: '#2D9D5E' }} />
              </button>
            ) : (
              <button type="button" onClick={() => { setEditingId(s.id); setEditingValue(s.size) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <Pencil style={{ width: '12px', height: '12px', color: '#B5B5B5' }} />
              </button>
            )}
            <button type="button" onClick={() => deleteSize.mutate(s.id)} disabled={deleteSize.isPending} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Trash2 style={{ width: '12px', height: '12px', color: '#B5B5B5' }} />
            </button>
          </div>
        </div>
      ))}

      <div className="flex" style={{ gap: '6px' }}>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAdd())}
          placeholder="Novo tamanho (ex: P, 38...)"
          style={{ ...inputStyle, flex: 1, fontSize: '13px', height: '34px' }}
          className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newName.trim() || addSize.isPending}
          className="flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ width: '34px', height: '34px', background: '#242424', borderRadius: '2px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
        >
          {addSize.isPending
            ? <Loader2 style={{ width: '13px', height: '13px', color: 'white' }} className="animate-spin" />
            : <Plus style={{ width: '14px', height: '14px', color: 'white' }} />}
        </button>
      </div>
    </div>
  )
}

// ─── Gerenciador de estoque existente (edição) ────────────────────────────────

function StockEditor({ itemId, categoryId, existingStocks }: {
  itemId: string
  categoryId: string
  existingStocks: ItemStock[]
}) {
  const { data: sizes = [] } = useCategorySizes(categoryId)
  const addStock = useAddItemStock(itemId)
  const updateStock = useUpdateItemStock(itemId)
  const deleteStock = useDeleteItemStock(itemId)
  const [showEditor, setShowEditor] = useState(false)
  const [pendingSizeId, setPendingSizeId] = useState('')
  const [pendingQty, setPendingQty] = useState('1')

  const usedSizeIds = existingStocks.map((s) => s.sizeId)
  const availableSizes = sizes.filter((s) => !usedSizeIds.includes(s.id))

  function handleAdd() {
    if (!pendingSizeId) return
    addStock.mutate(
      { sizeId: pendingSizeId, quantity: parseInt(pendingQty) || 1, available: true },
      { onSuccess: () => { setPendingSizeId(''); setPendingQty('1') } },
    )
  }

  return (
    <div className="flex flex-col" style={{ gap: '8px' }}>
      <div className="flex" style={{ gap: '8px' }}>
        <select
          value={pendingSizeId}
          onChange={(e) => setPendingSizeId(e.target.value)}
          style={{ ...selectStyle, flex: 1, color: pendingSizeId ? '#292D32' : '#B5B5B5' }}
          className="focus:border-[#5D5D5D] transition-colors"
          disabled={availableSizes.length === 0}
        >
          <option value="">
            {sizes.length === 0
              ? 'Nenhum tamanho cadastrado'
              : availableSizes.length === 0
                ? 'Todos os tamanhos adicionados'
                : 'Adicionar tamanho'}
          </option>
          {availableSizes.map((s) => (
            <option key={s.id} value={s.id} style={{ color: '#292D32' }}>{s.size}</option>
          ))}
        </select>

        <input
          type="number" min="1" max="9999"
          value={pendingQty}
          onChange={(e) => setPendingQty(e.target.value)}
          placeholder="Qtd"
          style={{ ...inputStyle, width: '64px' }}
          className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors"
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={!pendingSizeId || addStock.isPending}
          className="flex items-center justify-center transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
          style={{ width: '40px', height: '40px', background: '#242424', borderRadius: '2px', border: 'none', cursor: 'pointer' }}
        >
          {addStock.isPending
            ? <Loader2 style={{ width: '14px', height: '14px', color: 'white' }} className="animate-spin" />
            : <Plus style={{ width: '16px', height: '16px', color: 'white' }} />}
        </button>

        <button
          type="button"
          onClick={() => setShowEditor((v) => !v)}
          title="Gerenciar tamanhos da categoria"
          className="flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
          style={{ width: '40px', height: '40px', background: showEditor ? '#E5E5E5' : 'white', border: '1px solid #E5E5E5', borderRadius: '2px', cursor: 'pointer' }}
        >
          <Settings2 style={{ width: '15px', height: '15px', color: '#5D5D5D' }} />
        </button>
      </div>

      {showEditor && <CatalogSizeEditor categoryId={categoryId} onClose={() => setShowEditor(false)} />}

      {existingStocks.length > 0 && (
        <div className="flex flex-col" style={{ gap: '5px' }}>
          {existingStocks.map((stock) => (
            <div
              key={stock.id}
              className="flex items-center"
              style={{ height: '38px', padding: '0 12px', border: '1px solid #E5E5E5', borderRadius: '2px', background: stock.available ? 'white' : '#FAFAFA', gap: '10px' }}
            >
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#292D32', fontWeight: 500, minWidth: '52px' }}>
                {stock.size.size}
              </span>

              <div className="flex items-center" style={{ gap: '4px' }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', color: '#B5B5B5', letterSpacing: '0.04em' }}>Qtd</span>
                <input
                  type="number" min="1" max="9999"
                  defaultValue={stock.quantity}
                  onBlur={(e) => {
                    const qty = Math.max(1, parseInt(e.target.value) || 1)
                    if (qty !== stock.quantity)
                      updateStock.mutate({ stockId: stock.id, sizeId: stock.sizeId, quantity: qty, available: stock.available })
                  }}
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#292D32', width: '48px', height: '26px', padding: '0 6px', border: '1px solid #E5E5E5', borderRadius: '2px', outline: 'none', background: 'white', textAlign: 'center' }}
                  className="focus:border-[#5D5D5D] transition-colors"
                />
              </div>

              <div className="flex items-center" style={{ gap: '10px', marginLeft: 'auto' }}>
                <button
                  type="button"
                  onClick={() => updateStock.mutate({ stockId: stock.id, sizeId: stock.sizeId, quantity: stock.quantity, available: !stock.available })}
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', letterSpacing: '0.06em', color: stock.available ? '#2D9D5E' : '#B5B5B5', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textTransform: 'uppercase' }}
                >
                  {stock.available ? 'Disponível' : 'Indisponível'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteStock.mutate(stock.id)}
                  disabled={deleteStock.isPending}
                  className="flex items-center justify-center hover:opacity-60 transition-opacity"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X style={{ width: '13px', height: '13px', color: '#B5B5B5' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EditItemPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: item, isLoading } = useItem(itemId ?? '')
  const { data: categories = [] } = useCategories()
  const { mutate: updateItem, isPending, error } = useUpdateItem()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [color, setColor] = useState('')
  const [price, setPrice] = useState('')
  const [active, setActive] = useState(true)
  const [newImages, setNewImages] = useState<File[]>([])
  const [newPreviews, setNewPreviews] = useState<string[]>([])
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [deleteImageError, setDeleteImageError] = useState<string | null>(null)

  // Preenche os campos quando o item carrega
  useEffect(() => {
    if (!item) return
    setName(item.name)
    setDescription(item.description ?? '')
    setCategoryId(item.categoryId)
    setColor(item.color ?? '')
    setPrice(String(item.price))
    setActive(item.active)
  }, [item])

  async function handleDeleteExistingImage(imageId: string) {
    setDeletingImageId(imageId)
    setDeleteImageError(null)
    try {
      await apiDelete(`/items/${itemId}/images/${imageId}`)
      await queryClient.invalidateQueries({ queryKey: ['item', itemId] })
      await queryClient.invalidateQueries({ queryKey: ['items'] })
    } catch {
      setDeleteImageError('Erro ao remover imagem. Tente novamente.')
    } finally {
      setDeletingImageId(null)
    }
  }

  function handleNewImageChange(e: React.ChangeEvent<HTMLInputElement>, slot: number) {
    const file = e.target.files?.[0]
    if (!file) return
    const imgs = [...newImages]
    const prevs = [...newPreviews]
    if (prevs[slot]) URL.revokeObjectURL(prevs[slot])
    imgs[slot] = file
    prevs[slot] = URL.createObjectURL(file)
    setNewImages(imgs)
    setNewPreviews(prevs)
    e.target.value = ''
  }

  function handleRemoveNewImage(slot: number) {
    const imgs = [...newImages]
    const prevs = [...newPreviews]
    if (prevs[slot]) URL.revokeObjectURL(prevs[slot])
    imgs.splice(slot, 1)
    prevs.splice(slot, 1)
    setNewImages(imgs)
    setNewPreviews(prevs)
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !categoryId || !itemId) return
    updateItem(
      {
        id: itemId,
        name: name.trim(),
        description: description.trim() || undefined,
        color: color || undefined,
        price: parseFloat(price),
        categoryId,
        active,
        newImages: newImages.length ? newImages : undefined,
      },
      { onSuccess: () => navigate('/') },
    )
  }

  if (isLoading) {
    return (
      <div className="h-dvh bg-white flex items-center justify-center">
        <Sparkles style={{ width: '28px', height: '28px', color: '#D1D5DB' }} className="animate-pulse" />
      </div>
    )
  }

  if (!item) {
    return (
      <div className="h-dvh bg-white flex items-center justify-center">
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', color: '#5D5D5D' }}>Peça não encontrada</span>
      </div>
    )
  }

  const existingImages = item.images ?? []
  const totalImages = existingImages.length + newImages.length
  const newSlots = Math.max(0, 4 - existingImages.length)

  return (
    <div className="min-h-dvh bg-white relative flex flex-col">

      <div className="fixed inset-x-0 top-0 h-[184px] bg-[#242424] z-0" />

      <button
        onClick={() => navigate('/')}
        className="fixed flex items-center gap-1 text-white/70 hover:text-white transition-colors z-20"
        style={{ left: '56px', top: '84px' }}
      >
        <ChevronLeft style={{ width: '16px', height: '16px' }} />
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', fontWeight: 500, letterSpacing: '0.04em' }}>
          Voltar
        </span>
      </button>

      <img
        src="/images/logo.png"
        alt="Bete Atelier"
        className="fixed left-1/2 -translate-x-1/2 object-cover object-top z-10"
        style={{ top: '52px', width: '95px', height: '90px' }}
      />

      <div
        className="relative z-10 flex flex-col px-4 md:px-14"
        style={{ paddingTop: '196px', paddingBottom: '40px' }}
      >
        <h1
          style={{ fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: '22px', letterSpacing: '0.04em', color: '#292D32', marginBottom: '22px' }}
        >
          Editar Peça
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row" style={{ gap: '24px', alignItems: 'flex-start' }}>

          {/* ── Campos ── */}
          <div className="flex flex-col flex-1" style={{ gap: '20px' }}>

            <Field label="Nome *">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={inputStyle}
                className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors"
              />
            </Field>

            <Field label="Cor">
              <ColorPicker value={color} onChange={setColor} />
              {color && (
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', color: '#5D5D5D' }}>
                  {COLOR_OPTIONS.find(c => c.value === color)?.label}
                </span>
              )}
            </Field>

            <Field label="Categoria *">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                style={{ ...selectStyle, color: categoryId ? '#292D32' : '#B5B5B5' }}
                className="focus:border-[#5D5D5D] transition-colors"
              >
                <option value="" disabled>Selecionar</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ color: '#292D32' }}>{cat.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Tamanhos">
              {categoryId ? (
                <StockEditor itemId={item.id} categoryId={categoryId} existingStocks={item.stocks ?? []} />
              ) : (
                <div style={{ height: '40px', padding: '0 12px', border: '1px solid #E5E5E5', borderRadius: '2px', display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#B5B5B5' }}>
                    Selecione uma categoria primeiro
                  </span>
                </div>
              )}
            </Field>

            <div className="flex" style={{ gap: '20px', alignItems: 'flex-start' }}>
              <Field label="Descrição" style={{ flex: 1 }}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre a peça..."
                  rows={3}
                  style={{ fontFamily: "'Playfair Display', serif", fontSize: '14px', fontWeight: 400, color: '#292D32', padding: '12px 14px', border: '1px solid #E5E5E5', borderRadius: '2px', outline: 'none', background: 'white', resize: 'none', width: '100%', boxSizing: 'border-box' }}
                  className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors md:!h-[130px]"
                />
              </Field>
              <div className="flex flex-col flex-shrink-0" style={{ gap: '20px', width: '180px' }}>
                <Field label="Preço (R$)">
                  <input
                    type="number" min="0.01" step="0.01" required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0,00"
                    style={inputStyle}
                    className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors"
                  />
                </Field>
              </div>
            </div>

            {error && (
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', color: '#c0392b', padding: '8px 12px', border: '1px solid #f5c6cb', borderRadius: '2px', background: '#fff5f5', margin: 0 }}>
                {error.message}
              </p>
            )}

            <div className="flex items-center justify-between" style={{ paddingTop: '2px' }}>
              <div className="flex items-center" style={{ gap: '12px' }}>
                <Label>Peça ativa</Label>
                <button
                  type="button"
                  onClick={() => setActive((p) => !p)}
                  style={{ width: '44px', height: '26px', borderRadius: '13px', background: active ? '#292D32' : '#E5E5E5', position: 'relative', border: 'none', cursor: 'pointer', flexShrink: 0 }}
                >
                  <span style={{ position: 'absolute', top: '3px', left: active ? '21px' : '3px', width: '20px', height: '20px', borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </button>
              </div>

              <button
                type="submit"
                disabled={isPending || !name.trim() || !categoryId}
                className="flex items-center justify-center gap-2 transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ height: '40px', padding: '0 28px', background: '#242424', borderRadius: '2px', border: 'none', cursor: 'pointer', fontFamily: "'Playfair Display', serif", fontWeight: 500, fontSize: '13px', letterSpacing: '0.08em', color: 'white' }}
              >
                {isPending && <Loader2 style={{ width: '14px', height: '14px' }} className="animate-spin" />}
                {isPending ? 'Salvando...' : 'SALVAR ALTERAÇÕES'}
              </button>
            </div>

          </div>

          {/* Botão de imagens — quadrado */}
          <div className="relative md:sticky md:top-4">
            <button
              type="button"
              onClick={() => setImageModalOpen(true)}
              className="flex flex-col items-center justify-center hover:bg-gray-50 transition-colors relative"
              style={{ width: '90px', height: '90px', border: '1px solid #E5E5E5', borderRadius: '2px', background: 'white', cursor: 'pointer', gap: '6px' }}
            >
              <Images style={{ width: '22px', height: '22px', color: '#5D5D5D' }} />
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '11px', color: '#5D5D5D', letterSpacing: '0.04em' }}>
                Imagens
              </span>
            </button>
            {totalImages > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center" style={{ background: '#292D32', color: 'white', borderRadius: '50%', fontSize: '10px', width: '18px', height: '18px', fontWeight: 600 }}>
                {totalImages}
              </span>
            )}
          </div>

          {/* Modal de imagens */}
          {imageModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setImageModalOpen(false)}>
              <div
                className="flex flex-col bg-white"
                style={{ borderRadius: '4px', padding: '24px', width: '300px', gap: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.24)' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <Label>Imagens <span style={{ fontWeight: 400, color: '#B5B5B5' }}>({totalImages}/4)</span></Label>
                  <button type="button" onClick={() => setImageModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <X style={{ width: '16px', height: '16px', color: '#B5B5B5' }} />
                  </button>
                </div>

                {deleteImageError && (
                  <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '12px', color: '#c0392b', margin: 0 }}>
                    {deleteImageError}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>

                  {/* Imagens já salvas no servidor */}
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative">
                      <img
                        src={img.url}
                        alt=""
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'top', borderRadius: '2px', border: '1px solid #E5E5E5', display: 'block', opacity: deletingImageId === img.id ? 0.4 : 1 }}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img.id)}
                        disabled={!!deletingImageId}
                        className="absolute flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
                        style={{ top: '5px', right: '5px', width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.16)' }}
                      >
                        {deletingImageId === img.id
                          ? <Loader2 style={{ width: '9px', height: '9px', color: '#B5B5B5' }} className="animate-spin" />
                          : <X style={{ width: '9px', height: '9px', color: '#292D32' }} />
                        }
                      </button>
                    </div>
                  ))}

                  {/* Slots para novas imagens */}
                  {Array.from({ length: newSlots }).map((_, slot) => {
                    const preview = newPreviews[slot]
                    const isDisabled = slot > 0 && !newPreviews[slot - 1]
                    return (
                      <div key={`new-${slot}`} className="relative">
                        {preview ? (
                          <>
                            <img
                              src={preview}
                              alt={`Nova ${slot + 1}`}
                              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', objectPosition: 'top', borderRadius: '2px', border: '1px solid #E5E5E5', display: 'block' }}
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveNewImage(slot)}
                              className="absolute flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
                              style={{ top: '5px', right: '5px', width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #E5E5E5', boxShadow: '0 1px 3px rgba(0,0,0,0.16)' }}
                            >
                              <X style={{ width: '9px', height: '9px', color: '#292D32' }} />
                            </button>
                          </>
                        ) : (
                          <label
                            className={`flex flex-col items-center justify-center transition-colors ${isDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}
                            style={{ width: '100%', aspectRatio: '1/1', border: '1px dashed #B5B5B5', borderRadius: '2px', gap: '6px', display: 'flex' }}
                          >
                            <ImagePlus style={{ width: '18px', height: '18px', color: '#B5B5B5' }} />
                            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '10px', color: '#B5B5B5', textAlign: 'center' }}>
                              Adicionar
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleNewImageChange(e, slot)}
                              className="hidden"
                              disabled={isDisabled}
                            />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="hover:opacity-80 transition-opacity"
                  style={{ height: '38px', background: '#242424', border: 'none', borderRadius: '2px', cursor: 'pointer', fontFamily: "'Playfair Display', serif", fontSize: '13px', letterSpacing: '0.06em', color: 'white', fontWeight: 500 }}
                >
                  CONFIRMAR
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  )
}
