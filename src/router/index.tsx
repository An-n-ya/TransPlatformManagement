import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import AppLayout from '@/components/layout/AppLayout'
import { AuthGuard, GuestGuard, RoleGuard } from '@/router/guards'

/** Centralized app-wide loading fallback for lazy routes. */
function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      页面加载中...
    </div>
  )
}

/** Wrap a lazy() page in Suspense for code splitting + chunk loading. */
function lazyLoad(loader: () => Promise<{ default: ComponentType }>): ReactNode {
  const Component = lazy(loader)
  return (
    <Suspense fallback={<RouteFallback />}>
      <Component />
    </Suspense>
  )
}

/**
 * Route registry — lazy-loaded pages, declarative guards and role-based access.
 * The /admin app surface requires an admin role; /login is guest-only.
 */
export function createRouter() {
  return createBrowserRouter([
    {
      path: '/login',
      element: (
        <GuestGuard>
          {lazyLoad(() => import('@/pages/LoginPage'))}
        </GuestGuard>
      ),
    },
    {
      path: '/',
      element: (
        <RoleGuard roles={['admin']}>
          <AuthGuard>
            <AppLayout />
          </AuthGuard>
        </RoleGuard>
      ),
      children: [
        { index: true, element: lazyLoad(() => import('@/pages/DashboardPage')) },
        { path: 'users', element: lazyLoad(() => import('@/pages/UsersPage')) },
        { path: 'posts', element: lazyLoad(() => import('@/pages/PostsPage')) },
        { path: 'topics', element: lazyLoad(() => import('@/pages/TopicsPage')) },
        { path: 'invitations', element: lazyLoad(() => import('@/pages/InvitationsPage')) },
      ],
    },
    { path: '*', element: <Navigate to="/" replace /> },
  ])
}