import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ChevronLeft } from 'lucide-react'
import { useUserStore } from '@/stores/userStore'
import { apiPost } from '@/api/client'

interface LoginResponse {
  token: string
  user: {
    id: string
    name: string
    email: string | null
    cpf: string | null
    role: 'MASTER' | 'SELLER'
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuthenticated = useUserStore((s) => s.setAuthenticated)
  const setMaster = useUserStore((s) => s.setMaster)
  const setToken = useUserStore((s) => s.setToken)

  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!login.trim() || !password) return

    setError(null)
    setIsLoading(true)

    try {
      const data = await apiPost<LoginResponse>('/auth/login', {
        login: login.trim(),
        password,
      })

      setToken(data.token)
      setMaster(data.user.role === 'MASTER')
      setAuthenticated(true)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-mail, CPF ou senha incorretos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-dvh bg-white relative overflow-x-hidden flex flex-col">

      {/* ── Dark header band ── */}
      <div className="absolute inset-x-0 top-0 bg-[#242424]" style={{ height: '300px' }} />

      {/* ── Voltar ── */}
      <button
        onClick={() => navigate('/')}
        className="absolute z-20 flex items-center gap-1 text-white/60 hover:text-white transition-colors"
        style={{ left: '32px', top: '32px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <ChevronLeft style={{ width: '16px', height: '16px' }} />
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '13px', fontWeight: 500, letterSpacing: '0.04em' }}>
          Voltar
        </span>
      </button>

      {/* ── Logo ── */}
      <div className="relative z-10 flex justify-center" style={{ paddingTop: '72px' }}>
        <img
          src="/images/logo.png"
          alt="Bete Atelier"
          className="object-contain"
          style={{ width: '130px', height: '123px' }}
        />
      </div>

      {/* ── Form area ── */}
      <div
        className="relative z-10 flex flex-col items-center flex-1"
        style={{ paddingTop: '200px' }}
      >
        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col"
          style={{ maxWidth: '420px', padding: '0 32px', gap: '16px' }}
        >

          {/* ── E-mail ── */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <label
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#5D5D5D',
                textTransform: 'uppercase',
              }}
            >
              E-mail ou CPF
            </label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="seu@email.com ou 000.000.000-00"
              required
              autoComplete="username"
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '14px',
                fontWeight: 400,
                color: '#292D32',
                height: '44px',
                padding: '0 16px',
                border: '1px solid #E5E5E5',
                borderRadius: '2px',
                outline: 'none',
                background: 'white',
                boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.12)',
                width: '100%',
                boxSizing: 'border-box',
              }}
              className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors"
            />
          </div>

          {/* ── Senha ── */}
          <div className="flex flex-col" style={{ gap: '8px' }}>
            <label
              style={{
                fontFamily: "'Playfair Display', serif",
                fontWeight: 500,
                fontSize: '11px',
                letterSpacing: '0.1em',
                color: '#5D5D5D',
                textTransform: 'uppercase',
              }}
            >
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: '14px',
                  fontWeight: 400,
                  color: '#292D32',
                  height: '44px',
                  padding: '0 44px 0 16px',
                  border: '1px solid #E5E5E5',
                  borderRadius: '2px',
                  outline: 'none',
                  background: 'white',
                  boxShadow: '1px 1px 8px 0px rgba(0,0,0,0.12)',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                className="placeholder-[#B5B5B5] focus:border-[#5D5D5D] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                style={{ right: '14px', color: '#B5B5B5' }}
                tabIndex={-1}
              >
                {showPassword
                  ? <EyeOff style={{ width: '16px', height: '16px' }} />
                  : <Eye style={{ width: '16px', height: '16px' }} />
                }
              </button>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: '13px',
                color: '#c0392b',
                padding: '10px 14px',
                border: '1px solid #f5c6cb',
                borderRadius: '2px',
                background: '#fff5f5',
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={isLoading || !login.trim() || !password}
            className="flex items-center justify-center gap-2 transition-all hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              marginTop: '8px',
              height: '48px',
              background: '#242424',
              borderRadius: '2px',
              border: 'none',
              cursor: 'pointer',
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: '14px',
              letterSpacing: '0.1em',
              color: 'white',
            }}
          >
            {isLoading && <Loader2 style={{ width: '16px', height: '16px' }} className="animate-spin" />}
            {isLoading ? 'Entrando...' : 'ENTRAR'}
          </button>

        </form>
      </div>

      {/* ── Rodapé ── */}
      <div
        className="relative z-10 flex justify-center"
        style={{ paddingBottom: '40px' }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: '11px',
            letterSpacing: '0.06em',
            color: '#B5B5B5',
          }}
        >
          Bete Atelier · Moda e Elegância
        </span>
      </div>

    </div>
  )
}
