import { useCallback, useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Hash,
  Ticket,
  Bell,
  LogOut,
  Menu,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/auth'
import { useAppStore } from '@/store/app'
import { userApi } from '@/api'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

/** Navigation mirrors the real /admin backend feature set. */
const NAV_ITEMS = [
  { key: 'dashboard', href: '/', label: '数据概览', icon: LayoutDashboard },
  { key: 'users', href: '/users', label: '用户管理', icon: Users },
  { key: 'posts', href: '/posts', label: '帖文管理', icon: FileText },
  { key: 'topics', href: '/topics', label: '话题管理', icon: Hash },
  { key: 'invitations', href: '/invitations', label: '邀请码', icon: Ticket },
]

function resolveKey(pathname: string): string {
  if (pathname === '/') return 'dashboard'
  const hit = NAV_ITEMS.find(
    (n) => n.href !== '/' && pathname.startsWith(n.href)
  )
  return hit?.key ?? ''
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const sidebarOpen = useAppStore((s) => s.sidebarOpen)
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen)
  const setUser = useAuthStore((s) => s.setUser)

  const currentKey = resolveKey(location.pathname)

  // Reset scroll + close the mobile sidebar on navigation.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  // Refresh the profile from GET /admin/v1/users/me on mount (keeps counts in sync).
  useEffect(() => {
    userApi.me().then(setUser).catch(() => undefined)
  }, [setUser])

  const handleLogout = useCallback(() => {
    clearAuth()
    toast('已退出登录', { variant: 'info', description: '下次再见～' })
    navigate('/login', { replace: true })
  }, [clearAuth, navigate])

  const displayName = user?.nickname || user?.username || '管理员'
  const initials = displayName
    .split(/[-\s_.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0] ?? '')
    .join('')
    .toUpperCase()

  const roleLabel = user?.role === 'admin' ? '系统管理员' : user?.role || '管理员'

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur px-4 h-14">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="切换菜单"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#262626] flex items-center justify-center text-white text-sm font-bold">
              U
            </div>
            <div className="text-sm font-semibold tracking-tight">UGC 管理控制台</div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 border-r border-border bg-sidebar transition-transform duration-200',
            'lg:translate-x-0',
            sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
          )}
        >
          <div className="flex h-14 items-center gap-2 px-5 border-b border-border">
            <div className="h-8 w-8 rounded-xl bg-[#262626] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              U
            </div>
            <div className="leading-tight">
              <div className="text-[15px] font-semibold tracking-tight">UGC 管理控制台</div>
              <div className="text-[11px] text-muted-foreground">管理员后台 · v1.0</div>
            </div>
          </div>

          <nav className="p-3 space-y-0.5 overflow-y-auto h-[calc(100vh-9rem)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const active = currentKey === item.key
              return (
                <Link
                  key={item.key}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-border p-3 bg-sidebar">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <div className="text-xs font-medium text-foreground mb-1">需要帮助？</div>
              <div className="text-[11px] text-muted-foreground mb-2">
                查看接口文档获取使用说明。
              </div>
              <Button size="sm" variant="default" className="w-full h-8 text-xs">
                查看文档
              </Button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/40"
            onClick={() => setSidebarOpen(false)}
            aria-hidden
          />
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Topbar */}
          <header className="sticky top-0 z-30 h-14 border-b border-border bg-background/70 backdrop-blur px-4 lg:px-6 flex items-center gap-3">
            <div className="hidden sm:block w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="全局搜索 (按 Shift + K)"
                  className="h-9 w-full rounded-xl border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:ring-1 focus:ring-[#000] focus:border-[#000] placeholder:text-muted-foreground"
                />
              </div>
            </div>
            <div className="flex-1" />
            <Button variant="ghost" size="icon" aria-label="通知">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-xl border border-border bg-background hover:bg-black/5 transition-colors pl-1 pr-3 py-1 h-9"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar ?? undefined} alt={displayName} />
                    <AvatarFallback>{initials || 'A'}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-[11px] text-muted-foreground">{roleLabel}</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="text-[11px] text-muted-foreground font-normal">
                      {user?.email || `@${user?.username || 'admin'}`}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="!text-destructive focus:!text-destructive focus:!bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          <Separator />

          <main className="flex-1 min-w-0">
            <div className="mx-auto max-w-[1400px] px-4 lg:px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}