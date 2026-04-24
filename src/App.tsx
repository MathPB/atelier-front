import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUserStore } from '@/stores/userStore'
import { Sparkles } from 'lucide-react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Rotas críticas — carregadas imediatamente
import HomePage from '@/pages/HomePage'
import ItemDetailPage from '@/pages/ItemDetailPage'
import CartPage from '@/pages/CartPage'

// Rotas secundárias — carregadas sob demanda
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'))
const ItemsPage = lazy(() => import('@/pages/ItemsPage'))
const OrderSuccessPage = lazy(() => import('@/pages/OrderSuccessPage'))
const AddItemPage = lazy(() => import('@/pages/AddItemPage'))
const EditItemPage = lazy(() => import('@/pages/EditItemPage'))
const AgendaPage = lazy(() => import('@/pages/AgendaPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 15,
      gcTime: 1000 * 60 * 30,
      retry: 2,
    },
  },
})

function PageLoader() {
  return (
    <div className="min-h-dvh bg-white flex items-center justify-center">
      <Sparkles style={{ width: '28px', height: '28px', color: '#D1D5DB' }} className="animate-pulse" />
    </div>
  )
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/categorias" element={<CategoriesPage />} />
          <Route path="/categorias/:categoryId/itens" element={<ItemsPage />} />
          <Route path="/itens" element={<ItemsPage />} />
          <Route path="/itens/:itemId" element={<ItemDetailPage />} />
          <Route path="/carrinho" element={<CartPage />} />
          <Route path="/pedido-sucesso" element={<OrderSuccessPage />} />
          <Route
            path="/itens/novo"
            element={
              <AdminRoute>
                <AddItemPage />
              </AdminRoute>
            }
          />
          <Route
            path="/itens/:itemId/editar"
            element={
              <AdminRoute>
                <EditItemPage />
              </AdminRoute>
            }
          />
          <Route
            path="/agenda"
            element={
              <AdminRoute>
                <AgendaPage />
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
