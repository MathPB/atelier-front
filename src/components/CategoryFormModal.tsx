import { useState, useRef, useEffect } from 'react'
import { X, Camera, Trash2 } from 'lucide-react'
import type { Category } from '@/types'
import { useCreateCategory } from '@/hooks/useCreateCategory'
import { useUpdateCategory } from '@/hooks/useUpdateCategory'

interface CategoryFormModalProps {
  category?: Category | null
  onClose: () => void
}

export default function CategoryFormModal({ category, onClose }: CategoryFormModalProps) {
  const isEditing = !!category
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [maintenanceDays, setMaintenanceDays] = useState((category?.maintenanceDays ?? 0).toString())
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(category?.imageUrl ?? null)
  const [removeImage, setRemoveImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const createCategory = useCreateCategory()
  const updateCategory = useUpdateCategory()
  const isPending = createCategory.isPending || updateCategory.isPending

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleRemoveImage() {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      setError('Nome deve ter pelo menos 2 caracteres.')
      return
    }
    try {
      if (isEditing) {
        await updateCategory.mutateAsync({
          id: category.id,
          name: trimmed,
          description: description.trim() || undefined,
          maintenanceDays: maintenanceDays ? parseInt(maintenanceDays) : undefined,
          image: imageFile ?? undefined,
          removeImage,
        })
      } else {
        await createCategory.mutateAsync({
          name: trimmed,
          description: description.trim() || undefined,
          maintenanceDays: maintenanceDays ? parseInt(maintenanceDays) : undefined,
          image: imageFile ?? undefined,
        })
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar categoria.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-[#1a1a1a] overflow-hidden"
        style={{ border: '1px solid rgba(255,255,255,0.10)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-white text-lg"
          >
            {isEditing ? 'Editar categoria' : 'Nova categoria'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 py-5 flex flex-col gap-4">
          {/* Image picker */}
          <div className="flex items-center gap-4">
            <div
              className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.06] flex items-center justify-center"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            >
              {imagePreview && !removeImage ? (
                <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-6 h-6 text-white/20" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] text-white/70 text-sm hover:bg-white/[0.14] transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.10)' }}
              >
                {imagePreview && !removeImage ? 'Trocar imagem' : 'Adicionar imagem'}
              </button>
              {(imagePreview || imageFile) && !removeImage && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-rose-400/70 text-sm hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Vestidos"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.06] text-white placeholder-white/25 text-sm outline-none focus:ring-1 focus:ring-white/20 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              maxLength={100}
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.06] text-white placeholder-white/25 text-sm outline-none focus:ring-1 focus:ring-white/20 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            />
          </div>

          {/* Maintenance Days */}
          <div className="flex flex-col gap-1.5">
            <label className="text-white/50 text-xs uppercase tracking-widest">Manutenção (dias)</label>
            <input
              type="number"
              min="0"
              max="365"
              value={maintenanceDays}
              onChange={(e) => setMaintenanceDays(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2.5 rounded-lg bg-white/[0.06] text-white placeholder-white/25 text-sm outline-none focus:ring-1 focus:ring-white/20 transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            />
            <p className="text-white/30 text-xs">Período de preparação entre aluguéis</p>
          </div>

          {error && (
            <p className="text-rose-400 text-sm">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/[0.07] text-white/60 text-sm hover:bg-white/[0.12] transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.10)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
            >
              {isPending ? 'Salvando…' : isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
