import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-white flex flex-col items-center justify-center gap-4 px-8 text-center">
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '18px',
              fontWeight: 500,
              color: '#292D32',
            }}
          >
            Algo deu errado
          </p>
          <p
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '13px',
              color: '#5D5D5D',
            }}
          >
            Tente recarregar a página.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: '12px',
              fontWeight: 500,
              letterSpacing: '0.08em',
              color: 'white',
              background: '#242424',
              border: 'none',
              borderRadius: '2px',
              padding: '10px 24px',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Recarregar
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
