import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Loader2, ShoppingBag, CheckCircle2 } from 'lucide-react'
import { useCreateGuestReservation } from '@/hooks/useReservations'
import { useCartStore } from '@/stores/cartStore'
import type { CartItem } from '@/stores/cartStore'

function formatYYYYMMDD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

// ─── Header (igual à HomePage) ─────────────────────────────────────────────────

function PageHeader({ onBack }: { onBack?: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-[#242424] flex items-center justify-center" style={{ height: '184px', flexShrink: 0 }}>
      {onBack && (
        <button
          onClick={onBack}
          className="absolute flex items-center justify-center text-white/60 hover:text-white transition-colors"
          style={{ left: '56px', top: '76px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          title="Voltar ao carrinho"
        >
          ← Voltar
        </button>
      )}
      <img
        src="/images/logo.png"
        alt=""
        aria-hidden
        className="object-cover object-top"
        style={{ width: '95px', height: '90px' }}
      />
    </header>
  )
}

// ─── Step 1: Guest Form ────────────────────────────────────────────────────────

interface GuestFormProps {
  items: CartItem[]
  onSubmit: (data: { name: string; email: string; whatsapp: string; eventDate: string }) => void
  isSubmitting: boolean
}

function GuestForm({ items, onSubmit, isSubmitting }: GuestFormProps) {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function applyWhatsappMask(value: string) {
    let v = value.replace(/\D/g, '').slice(0, 11)
    if (v.length > 2) v = `(${v.slice(0, 2)}) ${v.slice(2)}`
    if (v.length > 10) v = `${v.slice(0, 10)}-${v.slice(10)}`
    return v
  }

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Nome obrigatório'
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'E-mail inválido'
    const digits = whatsapp.replace(/\D/g, '')
    if (digits.length < 10) e.whatsapp = 'WhatsApp inválido'
    if (!eventDate) e.eventDate = 'Data do evento obrigatória'
    return e
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    onSubmit({ name, email, whatsapp, eventDate })
  }

  const today = new Date()
  const minDate = formatYYYYMMDD(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <PageHeader onBack={() => navigate('/carrinho')} />

      <main className="flex-grow px-5 pb-10 flex flex-col gap-6 max-w-lg mx-auto w-full pt-8">
        {/* Title */}
        <div>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-slate-800 text-2xl font-light"
          >
            Finalizar Pedido
          </h1>
          <p className="text-slate-600 text-xs mt-1 uppercase tracking-widest font-sans">
            {items.length} {items.length === 1 ? 'peça selecionada' : 'peças selecionadas'}
          </p>
        </div>

        {/* Items summary (compact) */}
        <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
          {items.map((item, i) => (
            <div
              key={item.cartItemId}
              className={`flex items-center gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <div className="w-10 h-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.images?.[0] ? (
                  <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-slate-800 text-sm font-medium truncate"
                >
                  {item.name}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5 font-sans">
                  {[item.color, item.selectedSizeName].filter(Boolean).join(' · ')}
                  {item.quantity > 1 && <span className="ml-1">× {item.quantity}</span>}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Data do Evento */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-600 text-[10px] uppercase tracking-widest font-sans">
              Data do Evento *
            </label>
            <input
              type="date"
              value={eventDate}
              min={minDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="px-3 py-2.5 rounded-lg text-slate-800 text-sm outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans bg-white"
              style={{ border: `1px solid ${errors.eventDate ? '#ef4444' : '#e2e8f0'}` }}
            />
            {errors.eventDate && <p className="text-red-500 text-[11px] font-sans">{errors.eventDate}</p>}
          </div>

          {/* Nome */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-600 text-[10px] uppercase tracking-widest font-sans">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              className="px-3 py-2.5 rounded-lg text-slate-800 text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans bg-white"
              style={{ border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}` }}
            />
            {errors.name && <p className="text-red-500 text-[11px] font-sans">{errors.name}</p>}
          </div>

          {/* E-mail */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-600 text-[10px] uppercase tracking-widest font-sans">
              E-mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="px-3 py-2.5 rounded-lg text-slate-800 text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans bg-white"
              style={{ border: `1px solid ${errors.email ? '#ef4444' : '#e2e8f0'}` }}
            />
            {errors.email && <p className="text-red-500 text-[11px] font-sans">{errors.email}</p>}
          </div>

          {/* WhatsApp */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-600 text-[10px] uppercase tracking-widest font-sans">
              WhatsApp *
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(applyWhatsappMask(e.target.value))}
              placeholder="(00) 00000-0000"
              className="px-3 py-2.5 rounded-lg text-slate-800 text-sm placeholder-slate-500 outline-none focus:ring-1 focus:ring-slate-300 transition-all font-sans bg-white"
              style={{ border: `1px solid ${errors.whatsapp ? '#ef4444' : '#e2e8f0'}` }}
            />
            {errors.whatsapp && <p className="text-red-500 text-[11px] font-sans">{errors.whatsapp}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-4 rounded-xl bg-black text-white text-[11px] uppercase tracking-[0.35em] font-bold font-sans hover:bg-[#222] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> Processando...</>
            ) : (
              'Finalizar Pedido'
            )}
          </button>
        </form>
      </main>
    </div>
  )
}

// ─── Step 2: Order Confirmation ────────────────────────────────────────────────

interface ConfirmationProps {
  items: CartItem[]
  guestName: string
  eventDate: string
}

function OrderConfirmation({ items, guestName, eventDate }: ConfirmationProps) {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <PageHeader />

      <main className="flex-grow px-5 pb-10 flex flex-col gap-6 max-w-lg mx-auto w-full pt-8">
        {/* Success message */}
        <div className="flex flex-col items-center gap-3 pt-4 pb-2 text-center">
          <CheckCircle2 className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
          <div>
            <h1
              style={{ fontFamily: "'Playfair Display', serif" }}
              className="text-slate-800 text-2xl font-light"
            >
              Pedido Enviado!
            </h1>
            <p className="text-slate-400 text-xs mt-1.5 font-sans leading-relaxed">
              Olá, {guestName}. Seu pedido foi recebido.<br />
              Nossa equipe entrará em contato para confirmar os detalhes.
            </p>
          </div>
        </div>

        {/* Event date */}
        <div className="rounded-xl px-4 py-3 flex items-center justify-between border border-slate-100 bg-slate-50">
          <span className="text-slate-400 text-[10px] uppercase tracking-widest font-sans">Data do evento</span>
          <span
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-slate-800 text-sm"
          >
            {formatDisplayDate(eventDate)}
          </span>
        </div>

        {/* Items list */}
        <div>
          <p className="text-slate-400 text-[10px] uppercase tracking-widest font-sans mb-3">
            Resumo do Pedido
          </p>
          <div className="rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
            {items.map((item, i) => (
              <div
                key={item.cartItemId}
                className={`flex items-center gap-3 px-4 py-3 ${i < items.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                <div className="w-10 h-14 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {item.images?.[0] ? (
                    <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    className="text-slate-800 text-sm font-medium truncate"
                  >
                    {item.name}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5 font-sans">
                    {[item.color, item.selectedSizeName].filter(Boolean).join(' · ')}
                    {item.quantity > 1 && <span className="ml-1">× {item.quantity}</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info note */}
        <p className="text-slate-400 text-[11px] font-sans leading-relaxed text-center px-2">
          O valor do aluguel será combinado diretamente com a equipe Bete Atelier.
        </p>

        {/* Back to store */}
        <button
          onClick={() => navigate('/')}
          className="w-full py-4 rounded-xl bg-black text-white text-[11px] uppercase tracking-[0.35em] font-bold font-sans hover:bg-[#222] transition-all"
        >
          Voltar para a Loja
        </button>
      </main>
    </div>
  )
}

// ─── Page Controller ───────────────────────────────────────────────────────────

export default function OrderSuccessPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { clear } = useCartStore()
  const { mutateAsync: createReservation } = useCreateGuestReservation()

  const stateItems: CartItem[] | undefined = location.state?.items
  const [step, setStep] = useState<'form' | 'confirmation'>('form')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedData, setSubmittedData] = useState<{ name: string; eventDate: string } | null>(null)

  if (!stateItems || stateItems.length === 0) {
    navigate('/carrinho', { replace: true })
    return null
  }

  function calculateDates(eventDate: string) {
    const [y, m, d] = eventDate.split('-').map(Number)
    const event = new Date(y, m - 1, d)

    const startDate = new Date(event)
    startDate.setDate(startDate.getDate() - 3)

    const endDate = new Date(event)
    endDate.setDate(endDate.getDate() + 3)

    return {
      startDate: formatYYYYMMDD(startDate),
      endDate: formatYYYYMMDD(endDate),
    }
  }

  async function handleFormSubmit(data: { name: string; email: string; whatsapp: string; eventDate: string }) {
    setIsSubmitting(true)
    try {
      const { startDate, endDate } = calculateDates(data.eventDate)

      await createReservation({
        itemIds: stateItems!.map(item => item.id),
        clientName: data.name,
        clientPhone: data.whatsapp,
        clientEmail: data.email,
        eventDay: data.eventDate,
        startDate,
        endDate,
        notes: `Pedido do carrinho com ${stateItems!.length} item(ns). Evento: ${data.eventDate}`,
      })
      clear()
      setSubmittedData({ name: data.name, eventDate: data.eventDate })
      setStep('confirmation')
    } catch (err: any) {
      alert(err.message || 'Erro ao finalizar pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (step === 'confirmation' && submittedData) {
    return (
      <OrderConfirmation
        items={stateItems}
        guestName={submittedData.name}
        eventDate={submittedData.eventDate}
      />
    )
  }

  return (
    <GuestForm
      items={stateItems}
      onSubmit={handleFormSubmit}
      isSubmitting={isSubmitting}
    />
  )
}
