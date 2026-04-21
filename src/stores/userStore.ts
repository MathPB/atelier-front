import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserState {
  isMaster: boolean
  isAuthenticated: boolean
  token: string | null
  setMaster: (value: boolean) => void
  setAuthenticated: (value: boolean) => void
  setToken: (token: string) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isMaster: false,
      isAuthenticated: false,
      token: null,
      setMaster: (value) => set({ isMaster: value }),
      setAuthenticated: (value) => set({ isAuthenticated: value }),
      setToken: (token) => set({ token }),
      logout: () => set({ isMaster: false, isAuthenticated: false, token: null }),
    }),
    { name: 'bete-user' }
  )
)
