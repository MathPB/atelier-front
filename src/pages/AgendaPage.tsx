import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  CheckCircle2,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  CalendarPlus,
  List,
  CalendarDays,
} from 'lucide-react'
import { useItems } from '@/hooks/useItems'
import {
  useReservations,
  useCreateReservation,
  useCancelReservation,
  useCompleteReservation,
  useApproveReservation,
  useRejectReservation,
} from '@/hooks/useReservations'
import type { Reservation, CreateReservationPayload, Item } from '@/types'

// ─── Native Date Helpers ──────────────────────────────────────────────────────

function parseYYYYMMDD(dateString: string) {
  const parts = dateString.split('T')[0].split('-')
  if (parts.length < 3) return new Date()
  const y = parseInt(parts[0], 10)
  const m = parseInt(parts[1], 10) - 1
  const d = parseInt(parts[2], 10)
  return new Date(y, m, d, 0, 0, 0)
}

function formatYYYYMMDD(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function isCompleted(status?: string | null) {
  if (!status) return false
  const s = String(status).toUpperCase()
  const low = String(status).toLowerCase()
  return s === 'COMPLETED' || low.includes('complet') || low.includes('devolvid') || low.includes('return')
}

function isPendingApproval(status?: string | null) {
  if (!status) return false
  const s = String(status).toUpperCase()
  return s === 'PENDING_APPROVAL' || s === 'PENDING'
}

function getStatusLabel(status?: string | null) {
  if (isCompleted(status)) return 'Devolvido'
  if (isPendingApproval(status)) return 'Aguardando Aprovação'
  return 'Em Andamento'
}

function getStatusClasses(status?: string | null) {
  if (isCompleted(status)) return 'bg-blue-100 text-blue-800'
  if (isPendingApproval(status)) return 'bg-yellow-100 text-yellow-800'
  return 'bg-amber-100 text-amber-800'
}

function getCalendarEventClasses(status?: string | null) {
  if (isCompleted(status)) return 'bg-blue-50 border-blue-400 text-blue-900'
  if (isPendingApproval(status)) return 'bg-yellow-50 border-yellow-400 text-yellow-900'
  return 'bg-[#F2EDEA] border-[#D1A077] text-amber-900'
}

function getReservationItems(reservation: Reservation, allItems: Item[]): Item[] {
  if (reservation.items && reservation.items.length > 0) {
    return reservation.items
      .map(ri => ri.item || allItems.find(i => i.id === ri.itemId))
      .filter((i): i is Item => !!i)
  }
  if (reservation.itemId) {
    const item = allItems.find(i => i.id === reservation.itemId)
    return item ? [item] : []
  }
  return []
}

// ─── Header Principal ────────────────────────────────────────────────────────

function Header({ onBack }: { onBack: () => void }) {
  return (
    <div
      className="flex items-center relative bg-black border-b border-[#E5E5E5]"
      style={{ height: '84px', paddingLeft: '24px', paddingRight: '24px', flexShrink: 0 }}
    >
      <button
        onClick={onBack}
        className="flex items-center justify-center text-[#FFFFFF] hover:opacity-60 transition-opacity"
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

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

type SidebarTab = 'create' | 'upcoming' | 'calendar'

export default function AgendaPage() {
  const navigate = useNavigate()

  // API Data
  const { data: rawItems } = useItems()
  const items = rawItems?.filter((i) => i.active) ?? []
  const allItems = rawItems ?? []
  const { data: reservations, refetch: refetchReservations } = useReservations()
  const { mutate: createRes, isPending: isCreating } = useCreateReservation()
  const { mutate: cancelRes } = useCancelReservation()
  const { mutate: completeRes } = useCompleteReservation()
  const { mutate: approveRes } = useApproveReservation()
  const { mutate: rejectRes } = useRejectReservation()

  // Sidebar Tab State
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('upcoming')

  // Form State
  const [selectedItemId, setSelectedItemId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [eventDay, setEventDay] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => new Date())
  const [selectedEvent, setSelectedEvent] = useState<Reservation | null>(null)

  // ─── Upcoming Reservations ──────────────────────────────────────────────
  const upcomingReservations = useMemo(() => {
    if (!reservations) return []
    const today = formatYYYYMMDD(new Date())
    return reservations
      .filter(r => r.status !== 'CANCELLED' && r.endDate >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [reservations])

  // ─── Build Timeline Map ─────────────────────────────────────────────────
  const eventsByDay = useMemo(() => {
    const map: Record<string, Reservation[]> = {}
    if (!reservations) return map

    const activeRes = reservations.filter((r) => r.status !== 'CANCELLED')

    activeRes.forEach((res) => {
      const start = parseYYYYMMDD(res.startDate)
      const end = parseYYYYMMDD(res.endDate)
      for (let d = new Date(start.getTime()); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatYYYYMMDD(d)
        if (!map[key]) map[key] = []
        map[key].push(res)
      }
    })
    return map
  }, [reservations])

  // ─── Actions ─────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedItemId || !clientName || !clientPhone || !startDate || !endDate) {
      alert('Por favor, preencha os campos obrigatórios.')
      return
    }

    const payload: CreateReservationPayload = {
      itemId: selectedItemId,
      clientName,
      clientPhone,
      clientEmail,
      eventDay: eventDay || undefined,
      startDate,
      endDate,
      notes,
    }

    createRes(payload, {
      onSuccess: () => {
        setClientName('')
        setClientPhone('')
        setClientEmail('')
        setEventDay('')
        setStartDate('')
        setEndDate('')
        setNotes('')
        alert('Reserva criada com sucesso!')
      },
      onError: (err: any) => {
        alert(err.message || 'Erro ao criar reserva.')
      },
    })
  }

  function handleCancel(id: string) {
    if (confirm('Tem certeza que deseja cancelar esta reserva?')) {
      cancelRes(id, {
        onSuccess: () => setSelectedEvent(null),
      })
    }
  }

  function handleComplete(id: string) {
    if (confirm('Marcar esta peça como devolvida/concluída?')) {
      completeRes(id, {
        onSuccess: () => setSelectedEvent(null),
      })
    }
  }

  function handleApprove(id: string) {
    if (confirm('Aprovar este agendamento?')) {
      approveRes(id, {
        onSuccess: () => setSelectedEvent(null),
      })
    }
  }

  function handleReject(id: string) {
    if (confirm('Reprovar este agendamento?')) {
      rejectRes(id, {
        onSuccess: () => setSelectedEvent(null),
      })
    }
  }

  // ─── Calendar Grid Math ──────────────────────────────────────────────────
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDayOfWeek = new Date(year, month, 1).getDay()

  const blanks = Array.from({ length: startDayOfWeek }, () => null)
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const totalCells = blanks.length + days.length
  const paddingEnd = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)
  const blanksEnd = Array.from({ length: paddingEnd }, () => null)

  const allCells = [...blanks, ...days, ...blanksEnd]

  // ─── Render reservation detail items ─────────────────────────────────────
  function renderReservationItems(reservation: Reservation) {
    const resItems = getReservationItems(reservation, allItems)
    if (resItems.length === 0) {
      const fallbackItem = allItems.find(i => i.id === reservation.itemId)
      if (fallbackItem) {
        return (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-playfair text-lg text-slate-800 tracking-wide">
                {fallbackItem.name}
              </p>
              <p className="font-sans text-[10px] text-slate-500 font-mono mt-1">
                Ref: {fallbackItem.id.slice(0, 8)}
              </p>
            </div>
            <a
              href={`/itens/${fallbackItem.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
              title="Ver peça"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )
      }
      return <p className="font-playfair text-lg text-slate-400">Peça Desconhecida</p>
    }

    return (
      <div className="space-y-3">
        {resItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-2">
            <div>
              <p className="font-playfair text-base text-slate-800 tracking-wide">
                {item.name}
              </p>
              <p className="font-sans text-[10px] text-slate-500 font-mono mt-0.5">
                Ref: {item.id.slice(0, 8)}
              </p>
            </div>
            <a
              href={`/itens/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
              title="Ver peça"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        ))}
      </div>
    )
  }

  // ─── Calendar Grid (reusable) ─────────────────────────────────────────────
  function renderCalendarGrid() {
    return (
      <>
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-playfair text-xl lg:text-3xl font-light uppercase tracking-tight text-black">
            Painel de Agendamentos
          </h1>

          <div className="flex items-center gap-3 lg:gap-4 border border-gray-300 rounded-full px-3 lg:px-4 py-2">
            <button
              onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
              className="text-gray-500 hover:text-black transition-colors"
            >
              <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
            <h2 className="font-sans text-[10px] lg:text-[11px] uppercase tracking-widest font-normal min-w-[100px] lg:min-w-[120px] text-center text-black">
              {MONTH_NAMES[month]} {year}
            </h2>
            <button
              onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
              className="text-gray-500 hover:text-black transition-colors"
            >
              <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col border border-gray-300 rounded-sm overflow-hidden bg-white shadow-sm">
          {/* Header / Weekdays */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
            {DAY_NAMES.map((name) => (
              <div key={name} className="py-2 lg:py-3 text-center border-r last:border-0 border-gray-300">
                <span className="font-sans text-[9px] lg:text-[10px] uppercase font-normal tracking-[0.2em] text-gray-600">{name}</span>
              </div>
            ))}
          </div>

          {/* Grid Days */}
          <div className="grid grid-cols-7 flex-1 min-h-[400px] lg:min-h-[500px] auto-rows-fr">
            {allCells.map((day, idx) => {
              const isBlank = day === null
              const cellDate = isBlank ? null : new Date(year, month, day)
              const dateKey = cellDate ? formatYYYYMMDD(cellDate) : ''

              const dayEvents = dateKey ? (eventsByDay[dateKey] ?? []) : []

              return (
                <div
                  key={idx}
                  className={`min-h-[60px] lg:min-h-[100px] border-b border-r border-gray-200 p-1 lg:p-2 flex flex-col gap-0.5 lg:gap-1 ${isBlank ? 'bg-slate-50' : 'bg-white hover:bg-slate-50 transition-colors'} ${idx % 7 === 6 ? 'border-r-0' : ''}`}
                >
                  {!isBlank && (
                    <span className="font-playfair text-xs lg:text-sm text-gray-400 font-normal ml-0.5 lg:ml-1 mb-0.5 lg:mb-1 block">
                      {day}
                    </span>
                  )}

                  <div className="flex flex-col gap-0.5 lg:gap-1 flex-1 overflow-y-auto pr-0.5 lg:pr-1 custom-scrollbar">
                    {dayEvents.map((ev, eIdx) => {
                      const isStart = parseYYYYMMDD(ev.startDate).getTime() === cellDate?.getTime()
                      const evItems = getReservationItems(ev, allItems)
                      const targetItem = evItems[0] || items.find(i => i.id === ev.itemId)

                      return (
                        <div
                          key={`${ev.id}-${eIdx}`}
                          onClick={() => {
                            setSelectedEvent(ev)
                            setSidebarTab('create')
                          }}
                          className={`flex flex-col px-1 lg:px-2 py-1 lg:py-1.5 rounded-sm cursor-pointer border-l-2 transition-transform hover:translate-x-0.5
                            ${getCalendarEventClasses(ev.status)}
                          `}
                          title={`${targetItem?.name} - ${ev.clientName}`}
                        >
                          <span className="font-sans text-[7px] lg:text-[9px] font-bold uppercase tracking-widest truncate">
                            {targetItem?.name?.split(' ')[1] || 'Peça'}
                            {evItems.length > 1 ? ` +${evItems.length - 1}` : ''}
                          </span>
                          {isStart && (
                            <span className="font-playfair text-[10px] lg:text-xs truncate mt-0.5 hidden sm:block">
                              {ev.clientName.split(' ')[0]}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-dvh bg-white flex flex-col font-serif">
      <Header onBack={() => navigate('/')} />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* === SIDEBAR === */}
        <aside className="w-full lg:w-[400px] bg-white border-r border-[#E5E5E5] flex flex-col flex-shrink-0 overflow-y-auto max-h-[85vh] lg:max-h-none">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E5E5] flex-shrink-0">
            {selectedEvent ? (
              <>
                <h2 className="font-playfair text-base font-bold uppercase tracking-widest text-[#292D32]">
                  Reserva Oficial
                </h2>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </>
            ) : (
              <h2 className="font-playfair text-base font-bold uppercase tracking-widest text-[#292D32] mx-auto">
                Agendamentos
              </h2>
            )}
          </div>

          {selectedEvent ? (
            /* ── Reservation Detail View ── */
            <div className="flex flex-col flex-1 overflow-y-auto">
              <div className="p-6 space-y-5 flex-1">
                <div>
                  <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-slate-400 font-bold">Cliente</label>
                  <p className="font-playfair text-base text-slate-800 tracking-wide mt-1">{selectedEvent.clientName}</p>
                  <p className="font-sans text-xs text-slate-500 mt-1">{selectedEvent.clientPhone}</p>
                  {selectedEvent.clientEmail && (
                    <p className="font-sans text-xs text-slate-500 mt-0.5">{selectedEvent.clientEmail}</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-slate-400 font-bold">
                    {getReservationItems(selectedEvent, allItems).length > 1 ? 'Peças Reservadas' : 'Peça Reservada'}
                  </label>
                  <div className="mt-2">{renderReservationItems(selectedEvent)}</div>
                </div>

                {selectedEvent.eventDay && (
                  <div>
                    <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-slate-400 font-bold block mb-1">Data Evento</label>
                    <span className="font-playfair text-base text-slate-800">
                      {parseYYYYMMDD(selectedEvent.eventDay).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-5">
                  <div>
                    <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-slate-400 font-bold block mb-1">Retirada</label>
                    <span className="font-playfair text-base text-emerald-800">
                      {parseYYYYMMDD(selectedEvent.startDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-slate-400 font-bold block mb-1">Devolução</label>
                    <span className="font-playfair text-base text-rose-800">
                      {parseYYYYMMDD(selectedEvent.endDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-sans tracking-[0.2em] text-slate-400 font-bold">Status Atual</label>
                  <p className={`font-sans text-xs font-bold uppercase tracking-widest mt-2 px-3 py-1 inline-flex rounded-sm ${getStatusClasses(selectedEvent?.status)}`}>
                    {getStatusLabel(selectedEvent?.status)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 p-6 border-t border-slate-200">
                {isPendingApproval(selectedEvent?.status) && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedEvent.id)}
                      className="w-full bg-emerald-700 text-white font-sans text-[11px] font-bold uppercase tracking-[0.3em] py-3.5 flex justify-center items-center gap-2 hover:bg-emerald-800 transition-colors"
                    >
                      <ThumbsUp className="w-4 h-4" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleReject(selectedEvent.id)}
                      className="w-full bg-transparent border border-rose-200 text-rose-600 font-sans text-[11px] font-bold uppercase tracking-[0.3em] py-3.5 flex justify-center items-center gap-2 hover:bg-rose-50 transition-colors"
                    >
                      <ThumbsDown className="w-4 h-4" /> Reprovar
                    </button>
                  </>
                )}
                {!isCompleted(selectedEvent?.status) && !isPendingApproval(selectedEvent?.status) && (
                  <>
                    <button
                      onClick={() => handleComplete(selectedEvent.id)}
                      className="w-full bg-emerald-700 text-white font-sans text-[11px] font-bold uppercase tracking-[0.3em] py-3.5 flex justify-center items-center gap-2 hover:bg-emerald-800 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Marcar como Devolvido
                    </button>
                    <button
                      onClick={() => handleCancel(selectedEvent.id)}
                      className="w-full bg-transparent border border-rose-200 text-rose-600 font-sans text-[11px] font-bold uppercase tracking-[0.3em] py-3.5 flex justify-center items-center gap-2 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Cancelar Reserva
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* ── Accordion Sections ── */
            <div className="flex flex-col divide-y divide-[#E5E5E5]">

              {/* ── Seção: Criar Agendamento ── */}
              <div>
                <button
                  onClick={() => setSidebarTab(sidebarTab === 'create' ? 'upcoming' : 'create')}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CalendarPlus className="w-4 h-4 text-slate-500" />
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#292D32]">
                      Criar Agendamento
                    </span>
                  </div>
                  {sidebarTab === 'create'
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </button>

                {sidebarTab === 'create' && (
                  <div className="px-6 pb-6">
                    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                          Selecione a Peça
                        </label>
                        <select
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          className="w-full border border-slate-300 rounded-sm p-3 font-playfair text-sm focus:outline-none focus:border-slate-800 bg-white"
                          required
                        >
                          <option value="" disabled>-- Escolha a peça --</option>
                          {items.map((i) => (
                            <option key={i.id} value={i.id}>{i.name} (Ref: {i.id.slice(0, 6)})</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                          Data Evento
                        </label>
                        <input
                          type="date"
                          value={eventDay}
                          onChange={(e) => setEventDay(e.target.value)}
                          className="w-full border border-slate-300 rounded-sm p-3 font-sans text-xs focus:outline-none focus:border-slate-800"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                            Data Retirada
                          </label>
                          <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-sm p-3 font-sans text-xs focus:outline-none focus:border-slate-800"
                            required
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                            Data Devolução
                          </label>
                          <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-sm p-3 font-sans text-xs focus:outline-none focus:border-slate-800"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-slate-200 pt-5">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                          Nome da Noiva/Cliente
                        </label>
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full border border-slate-300 rounded-sm p-3 font-playfair text-sm focus:outline-none focus:border-slate-800"
                          placeholder="Ex: Maria Luiza"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                          E-mail do Cliente
                        </label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          className="w-full border border-slate-300 rounded-sm p-3 font-sans text-xs focus:outline-none focus:border-slate-800"
                          placeholder="cliente@email.com"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-slate-600">
                          Celular (WhatsApp)
                        </label>
                        <input
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '')
                            if (val.length > 2) val = `(${val.slice(0, 2)}) ${val.slice(2)}`
                            if (val.length > 10) val = `${val.slice(0, 10)}-${val.slice(10, 14)}`
                            setClientPhone(val)
                          }}
                          className="w-full border border-slate-300 rounded-sm p-3 font-sans text-xs focus:outline-none focus:border-slate-800"
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isCreating}
                        className="w-full bg-[#242424] text-white py-3.5 font-sans text-[11px] font-bold uppercase tracking-[0.4em] hover:bg-black transition-colors disabled:opacity-50"
                      >
                        {isCreating ? 'PROCESSANDO...' : 'CONFIRMAR RESERVA'}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* ── Seção: Próximos Agendamentos ── */}
              <div>
                <button
                  onClick={() => {
                    const next = sidebarTab === 'upcoming' ? 'create' : 'upcoming'
                    setSidebarTab(next)
                    if (next === 'upcoming') refetchReservations()
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <List className="w-4 h-4 text-slate-500" />
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#292D32]">
                      Próximos Agendamentos
                    </span>
                  </div>
                  {sidebarTab === 'upcoming'
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </button>

                {sidebarTab === 'upcoming' && (
                  <div className="px-6 pb-6">
                    <p className="font-sans text-[10px] uppercase tracking-widest text-slate-400 mb-4">
                      {upcomingReservations.length} agendamento{upcomingReservations.length !== 1 ? 's' : ''} encontrado{upcomingReservations.length !== 1 ? 's' : ''}
                    </p>
                    {upcomingReservations.length === 0 ? (
                      <p className="font-sans text-sm text-slate-400 text-center py-6">Nenhum agendamento futuro.</p>
                    ) : (
                      <div className="space-y-3">
                        {upcomingReservations.map((res) => {
                          const resItems = getReservationItems(res, allItems)
                          const itemName = resItems.length > 0 ? resItems[0].name : 'Peça'
                          const extraCount = resItems.length > 1 ? ` +${resItems.length - 1}` : ''
                          return (
                            <button
                              key={res.id}
                              onClick={() => setSelectedEvent(res)}
                              className={`w-full text-left p-4 border rounded-sm transition-colors ${
                                isPendingApproval(res.status)
                                  ? 'bg-yellow-50 border-yellow-400 hover:border-yellow-500'
                                  : 'bg-white border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-playfair text-sm text-slate-800 font-medium truncate">{res.clientName}</p>
                                  <p className="font-sans text-[10px] text-slate-500 mt-1 truncate">{itemName}{extraCount}</p>
                                </div>
                                <span className={`font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm flex-shrink-0 ${getStatusClasses(res.status)}`}>
                                  {getStatusLabel(res.status)}
                                </span>
                              </div>
                              <div className={`flex gap-4 mt-2 font-sans text-[10px] ${isPendingApproval(res.status) ? 'text-yellow-700' : 'text-slate-400'}`}>
                                <span>Retirada: {parseYYYYMMDD(res.startDate).toLocaleDateString('pt-BR')}</span>
                                <span>Devolução: {parseYYYYMMDD(res.endDate).toLocaleDateString('pt-BR')}</span>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Seção: Calendário (mobile/tablet only) ── */}
              <div className="lg:hidden">
                <button
                  onClick={() => {
                    const next = sidebarTab === 'calendar' ? 'create' : 'calendar'
                    setSidebarTab(next)
                    if (next === 'calendar') refetchReservations()
                  }}
                  className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CalendarDays className="w-4 h-4 text-slate-500" />
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-[#292D32]">
                      Calendário
                    </span>
                  </div>
                  {sidebarTab === 'calendar'
                    ? <ChevronUp className="w-4 h-4 text-slate-400" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </button>

                {sidebarTab === 'calendar' && (
                  <div className="p-3 bg-white">
                    {renderCalendarGrid()}
                  </div>
                )}
              </div>

            </div>
          )}
        </aside>

        {/* === CALENDAR GRID (desktop only) === */}
        <main className="hidden lg:flex flex-1 flex-col p-4 bg-white min-w-0">
          {renderCalendarGrid()}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E2E8F0;
          border-radius: 4px;
        }
      `}} />
    </div>
  )
}
