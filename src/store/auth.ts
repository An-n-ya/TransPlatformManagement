import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthResponse, UserVO } from '@/api/types'

/**
 * Global authentication + current-admin state.
 *
 * Kept pure (no API calls) so it can be consumed safely by the http layer and
 * the router guards. All network side effects live in the api modules instead.
 */
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserVO | null
  /** Called right after /admin/v1/auth/login or /refresh succeeds */
  setAuth: (res: AuthResponse) => void
  /** Replace profile, e.g. after GET /admin/v1/users/me */
  setUser: (user: UserVO) => void
  /** Fully clear credentials */
  clearAuth: () => void
  /** Update tokens only (used by the 401 auto-refresh flow) */
  setTokens: (accessToken: string, refreshToken: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setAuth: (res) =>
        set({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          user: res.user,
        }),
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'trans-platform-admin-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
)

/** Derived selector: has a usable access token */
export const selectIsLoggedIn = (s: Pick<AuthState, 'accessToken'>) =>
  Boolean(s.accessToken)

/** Derived selector: current admin holds the admin role */
export const selectIsAdmin = (s: Pick<AuthState, 'user'>) =>
  s.user?.role === 'admin'