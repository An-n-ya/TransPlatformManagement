import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuthStore, selectIsLoggedIn, selectIsAdmin } from '@/store/auth'
import { toast } from '@/components/ui/toast'

/**
 * Guards block navigation based on auth state / role.
 * All readers subscribe to the persisted auth store, so clearing tokens
 * (e.g. by the 401 refresh flow) re-renders guards and redirects instantly.
 */

/** Requires a valid access token; otherwise bounce to /login preserving the target. */
export function AuthGuard({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore(selectIsLoggedIn)
  const location = useLocation()
  if (!isLoggedIn) {
    const params = new URLSearchParams()
    params.set('redirect', location.pathname + location.search)
    return <Navigate to={`/login?${params.toString()}`} replace />
  }
  return <>{children}</>
}

/** Only reachable when NOT logged in (login page). */
export function GuestGuard({ children }: { children: ReactNode }) {
  const isLoggedIn = useAuthStore(selectIsLoggedIn)
  const location = useLocation()
  if (isLoggedIn) {
    const redirect = new URLSearchParams(location.search).get('redirect') || '/'
    return <Navigate to={redirect} replace />
  }
  return <>{children}</>
}

/**
 * Restricts an area to a set of roles. The admin backend only issues tokens to
 * admin accounts, so this is a defense-in-depth guard rather than the primary gate.
 */
export function RoleGuard({
  roles,
  children,
}: {
  roles: string[]
  children: ReactNode
}) {
  const isLoggedIn = useAuthStore(selectIsLoggedIn)
  const isAdmin = useAuthStore(selectIsAdmin)
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }
  if (!roles.includes('admin') || !isAdmin) {
    toast('权限不足', { variant: 'error', description: '当前账号无权访问管理后台' })
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}