import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, X } from 'lucide-react'
import { useItem } from '@/hooks/useItems'
import { useCartStore } from '@/stores/cartStore'
import { useUserStore } from '@/stores/userStore'
import { getColorInfo } from '@/utils/colors'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 500,
  fontSize: '11px',
  letterSpacing: '0.1em',
  color: '#5D5D5D',
  textTransform: 'uppercase',
}

const bodyText: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontWeight: 400,
  fontSize: '14px',
  lineHeight: '1.6em',
  color: '#292D32',
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ urls, startIndex, onClose }: { urls: string[]; startIndex: number; onClose: () => void }) {
  const [index, setIndex] = useState(startIndex)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, urls.length - 1))
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0))
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [urls.length, onClose])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) < 30) return
    if (delta > 0) setIndex((i) => Math.min(i + 1, urls.length - 1))
    else setIndex((i) => Math.max(i - 1, 0))
    touchStartX.current = null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de imagens"
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Fechar */}
      <button
        onClick={onClose}
        aria-label="Fechar galeria"
        className="absolute top-4 right-4 flex items-center justify-center"
        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: 'none', cursor: 'pointer', zIndex: 1 }}
      >
        <X style={{ width: '20px', height: '20px', color: 'white' }} />
      </button>

      {/* Imagem */}
      <img
        src={urls[index]}
        alt={`Foto ${index + 1} de ${urls.length}`}
        className="max-w-full max-h-full object-contain"
        style={{ maxHeight: '100dvh', maxWidth: '100dvw' }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Setas */}
      {urls.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.max(i - 1, 0)) }}
            disabled={index === 0}
            aria-label="Imagem anterior"
            className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center disabled:opacity-0"
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer' }}
          >
            <ChevronLeft style={{ width: '22px', height: '22px', color: 'white' }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.min(i + 1, urls.length - 1)) }}
            disabled={index === urls.length - 1}
            aria-label="Próxima imagem"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center disabled:opacity-0"
            style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer' }}
          >
            <ChevronRight style={{ width: '22px', height: '22px', color: 'white' }} />
          </button>
        </>
      )}

      {/* Indicadores */}
      {urls.length > 1 && (
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center" style={{ gap: '6px' }}>
          {urls.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.stopPropagation(); setIndex(i) }}
              aria-label={`Ir para foto ${i + 1}`}
              aria-current={i === index ? 'true' : undefined}
              style={{
                width: i === index ? '8px' : '6px',
                height: i === index ? '8px' : '6px',
                borderRadius: '50%',
                background: i === index ? 'white' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s',
                cursor: 'pointer',
                border: 'none',
                padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Carrossel de imagens full-width ─────────────────────────────────────────

function ImageCarousel({ urls }: { urls: string[] }) {
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) < 30) return
    if (delta > 0) setIndex((i) => Math.min(i + 1, urls.length - 1))
    else setIndex((i) => Math.max(i - 1, 0))
    touchStartX.current = null
  }

  if (urls.length === 0) {
    return (
      <div
        className="w-full bg-gray-100 flex items-center justify-center"
        style={{ aspectRatio: '1/1' }}
      >
        <Sparkles style={{ width: '36px', height: '36px', color: '#D1D5DB' }} />
      </div>
    )
  }

  return (
    <>
      {lightboxOpen && (
        <Lightbox urls={urls} startIndex={index} onClose={() => setLightboxOpen(false)} />
      )}
      <div
        className="w-full relative overflow-hidden"
        style={{ aspectRatio: '1/1', cursor: 'zoom-in' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => setLightboxOpen(true)}
      >
        <img
          src={urls[index]}
          alt=""
          className="w-full h-full object-cover object-top"
        />

        {/* Setas de navegação — visíveis apenas em desktop */}
        {urls.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.max(i - 1, 0)) }}
              disabled={index === 0}
              className="flex absolute left-3 top-1/2 -translate-y-1/2 items-center justify-center transition-opacity hover:opacity-100 disabled:opacity-0"
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              <ChevronLeft style={{ width: '18px', height: '18px', color: '#292D32' }} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIndex((i) => Math.min(i + 1, urls.length - 1)) }}
              disabled={index === urls.length - 1}
              className="flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center transition-opacity hover:opacity-100 disabled:opacity-0"
              style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.85)', border: 'none', cursor: 'pointer', backdropFilter: 'blur(4px)' }}
            >
              <ChevronRight style={{ width: '18px', height: '18px', color: '#292D32' }} />
            </button>
          </>
        )}

        {/* Indicadores */}
        {urls.length > 1 && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center"
            style={{ gap: '5px', padding: '10px 0', background: 'linear-gradient(to top, rgba(0,0,0,0.32), transparent)' }}
          >
            {urls.map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); setIndex(i) }}
                style={{
                  width: i === index ? '7px' : '5px',
                  height: i === index ? '7px' : '5px',
                  borderRadius: '50%',
                  background: i === index ? 'white' : 'rgba(255,255,255,0.5)',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>()
  const navigate = useNavigate()
  const { data: item, isLoading } = useItem(itemId ?? '')
  const isMaster = useUserStore((s) => s.isMaster)
  const addItem = useCartStore((s) => s.addItem)
  const hasItem = useCartStore((s) => s.hasItem)
  const [selectedSizeId, setSelectedSizeId] = useState<string | undefined>(undefined)
  const inCart = item ? hasItem(item.id, selectedSizeId) : false

  if (isLoading) {
    return (
      <div className="min-h-dvh bg-white flex flex-col">
        <Header onBack={() => navigate('/')} />
        <div className="flex-1 flex items-center justify-center">
          <Sparkles style={{ width: '28px', height: '28px', color: '#D1D5DB' }} className="animate-pulse" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-dvh bg-white flex flex-col">
        <Header onBack={() => navigate('/')} />
        <div className="flex-1 flex flex-col items-center justify-center" style={{ gap: '8px' }}>
          <Sparkles style={{ width: '28px', height: '28px', color: '#D1D5DB' }} />
          <p style={{ ...bodyText, color: '#5D5D5D' }}>Peça não encontrada</p>
        </div>
      </div>
    )
  }

  const imageUrls = item.images?.map((img) => img.url) ?? []
  const colorInfo = item.color ? getColorInfo(item.color) : null
  const availableSizes = item.stocks?.filter((s) => s.available) ?? []
  const isAvailable = availableSizes.length > 0 || item.stocks?.length === 0

  return (
    <div className="min-h-dvh bg-white flex flex-col">

      {/* ── Header ── */}
      <Header onBack={() => navigate('/')} />

      {/* ── Imagem — limitada no desktop ── */}
      <div className="w-full flex justify-center">
        <div className="w-full lg:max-w-sm">
          <ImageCarousel urls={imageUrls} />
        </div>
      </div>

      {/* ── Conteúdo ── */}
      <div className="flex flex-col" style={{ padding: '24px 24px 48px 24px', gap: '24px' }}>

        {/* Nome + badge disponibilidade */}
        <div className="flex items-start justify-between" style={{ gap: '12px' }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              fontSize: '22px',
              letterSpacing: '0.04em',
              color: '#000000',
              textTransform: 'uppercase',
              lineHeight: '1.2em',
            }}
          >
            {item.name}
          </h1>
          <span
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '12px',
              fontWeight: 400,
              color: isAvailable ? '#2D9D5E' : '#B5B5B5',
              border: `1px solid ${isAvailable ? '#2D9D5E' : '#E5E5E5'}`,
              borderRadius: '2px',
              padding: '5px 10px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {isAvailable ? 'Disponível para alugar' : 'Indisponível'}
          </span>
        </div>

        {/* Cor */}
        {colorInfo && (
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <span style={sectionLabel}>Cor</span>
            <div className="flex items-center" style={{ gap: '8px' }}>
              <div
                className="rounded-full"
                style={{
                  width: '36px',
                  height: '36px',
                  background: colorInfo.fill,
                  border: `1px solid ${colorInfo.border}`,
                  boxShadow: '1px 1px 4px rgba(0,0,0,0.16)',
                  flexShrink: 0,
                }}
              />
              <span style={{ ...bodyText, fontWeight: 700 }}>{colorInfo.label}</span>
            </div>
          </div>
        )}

        {/* Tamanhos */}
        {availableSizes.length > 0 && (
          <div className="flex flex-col" style={{ gap: '10px' }}>
            <span style={sectionLabel}>Tamanhos</span>
            <div className="flex flex-wrap" style={{ gap: '8px' }}>
              {availableSizes.map((stock) => {
                const isSelected = selectedSizeId === stock.sizeId;
                return (
                  <button
                    key={stock.id}
                    onClick={() => setSelectedSizeId(stock.sizeId)}
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: '13px',
                      fontWeight: 400,
                      color: isSelected ? 'white' : '#292D32',
                      background: isSelected ? '#292D32' : 'transparent',
                      border: `1px solid ${isSelected ? '#292D32' : '#D0D0D0'}`,
                      borderRadius: '2px',
                      padding: '6px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {stock.size.size}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '0.5px', background: '#E5E5E5' }} />

        {/* Descrição */}
        {item.description && (
          <>
            <div className="flex flex-col" style={{ gap: '8px' }}>
              <span style={sectionLabel}>Descrição</span>
              <p style={bodyText}>{item.description}</p>
            </div>
            <div style={{ height: '0.5px', background: '#E5E5E5' }} />
          </>
        )}

        {/* Botão adicionar ao carrinho — oculto para admin */}
        {!isMaster && <button
          onClick={() => {
            if (availableSizes.length > 0 && !selectedSizeId) return;
            if (!inCart) {
              const sizeName = availableSizes.find(s => s.sizeId === selectedSizeId)?.size.size;
              addItem(item, selectedSizeId, sizeName);
            }
            navigate('/carrinho')
          }}
          disabled={availableSizes.length > 0 && !selectedSizeId}
          className="flex items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            height: '48px',
            background: inCart ? '#F5F5F5' : '#242424',
            border: inCart ? '1px solid #E5E5E5' : 'none',
            borderRadius: '2px',
            cursor: (availableSizes.length > 0 && !selectedSizeId) ? 'not-allowed' : 'pointer',
            fontFamily: "'Playfair Display', serif",
            fontWeight: 500,
            fontSize: '13px',
            letterSpacing: '0.08em',
            color: inCart ? '#5D5D5D' : 'white',
          }}
        >
          <ShoppingBag style={{ width: '16px', height: '16px' }} />
          {inCart ? 'VER NO CARRINHO' : (availableSizes.length > 0 && !selectedSizeId) ? 'SELECIONE UM TAMANHO' : 'ADICIONAR AO CARRINHO'}
        </button>}

      </div>
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex items-center relative bg-white"
      style={{ height: '84px', paddingLeft: '24px', paddingRight: '24px', flexShrink: 0 }}
    >
      <button
        onClick={onBack}
        className="flex items-center justify-center text-[#292D32] hover:opacity-60 transition-opacity"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ChevronLeft style={{ width: '22px', height: '22px' }} />
      </button>

      <img
        src="/images/logo.png"
        alt="Bete Atelier"
        className="absolute left-1/2 -translate-x-1/2 object-cover object-top"
        style={{ width: '60px', height: '56px' }}
      />
    </div>
  )
}
