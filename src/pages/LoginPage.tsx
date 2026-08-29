import { useCallback, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/auth'
import { toast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redirect = new URLSearchParams(location.search).get('redirect') || '/'

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      if (!username.trim()) {
        setError('请输入管理员账号')
        return
      }
      if (!password) {
        setError('请输入登录密码')
        return
      }
      setLoading(true)
      try {
        // Real endpoint: POST /admin/v1/auth/login (adminLogin, enforces admin role)
        const res = await authApi.login({
          username: username.trim(),
          password,
        })
        setAuth(res)
        toast('登录成功', {
          variant: 'success',
          description: `欢迎回来，${res.user.nickname || res.user.username}`,
        })
        navigate(redirect, { replace: true })
      } catch (err) {
        const message =
          (err as Error)?.message || '登录失败，请稍后重试'
        setError(message)
        toast('登录失败', { variant: 'error', description: message })
      } finally {
        setLoading(false)
      }
    },
    [username, password, navigate, redirect, setAuth]
  )

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex lg:w-1/2 overflow-hidden bg-gradient-to-br from-[#f7f7f5] via-[#eef2ec] to-[#f3efe6]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(38,38,38,0.08),transparent_45%),radial-gradient(circle_at_85%_80%,rgba(241,90,43,0.12),transparent_45%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="YX Logo"
              className="h-10 w-10 rounded-2xl object-contain bg-white/70 shadow-lg"
            />
            <div>
              <div className="text-lg font-semibold tracking-tight">YX · 银杏叶社区</div>
              <div className="text-xs text-muted-foreground">跨性别社区 · 管理后台</div>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/60 px-3 py-1 text-xs font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-[#15a877]" />
              平台运行状态：一切正常
            </div>
            <h1 className="text-4xl font-semibold tracking-tight leading-[1.15]">
              守护社区，
              <br />
              连接每一位成员。
            </h1>
            <p className="text-[15px] text-muted-foreground leading-relaxed">
              一站式管理用户、内容、话题与邀请码。实时监控社区健康度，维护安全、包容的社区秩序。
            </p>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <Separator className="flex-1 bg-border/70" />
            <span>为 YX 社区运营团队打造</span>
            <Separator className="flex-1 bg-border/70" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img
              src={logo}
              alt="YX Logo"
              className="h-9 w-9 rounded-xl object-contain bg-white/70"
            />
            <div>
              <div className="text-[15px] font-semibold tracking-tight">YX · 银杏叶社区</div>
              <div className="text-[11px] text-muted-foreground">管理员 · 登录</div>
            </div>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-semibold tracking-tight mb-1.5">欢迎回来</h1>
            <p className="text-sm text-muted-foreground">
              请使用管理员账号登录，进入平台后台进行管理。
            </p>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="space-y-1.5">
                  <Label htmlFor="username" className="text-xs font-medium">
                    管理员账号
                  </Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    placeholder="请输入用户名或账号"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={cn(error && !username.trim() && 'border-destructive')}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-medium">
                      登录密码
                    </Label>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="请输入密码"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={cn(
                        'pr-10',
                        error && !password && 'border-destructive'
                      )}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                      aria-label={showPassword ? '隐藏密码' : '显示密码'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg border border-[#e8463a]/20 bg-[#e8463a]/10 px-3 py-2 text-xs text-[#e8463a]">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  variant="default"
                  disabled={loading}
                  className="w-full h-10 rounded-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      立即登录
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-[11px] text-muted-foreground">
            登录即表示您同意《平台服务协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  )
}