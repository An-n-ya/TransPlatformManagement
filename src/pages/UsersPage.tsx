import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  FilterX,
  Loader2,
  RefreshCcw,
  Search,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { userApi } from '@/api'
import type { UserVO } from '@/api/types'
import { cn, formatDate, formatNumber } from '@/lib/utils'

type FollowTab = 'followers' | 'followees'

function initialsOf(nick?: string, username?: string) {
  const name = nick || username || 'U'
  return name
    .split(/[-\s_.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0] ?? '')
    .join('')
    .toUpperCase()
}

export default function UsersPage() {
  const [searchInput, setSearchInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const [page, setPage] = useState(0)
  const [size, setSize] = useState<10 | 20 | 50>(20)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<UserVO[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const [detailUser, setDetailUser] = useState<UserVO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [followTab, setFollowTab] = useState<FollowTab>('followers')
  const [followData, setFollowData] = useState<UserVO[]>([])
  const [followLoading, setFollowLoading] = useState(false)

  const fetchSearch = useCallback(
    async (kw: string, p: number, sz: number) => {
      if (!kw.trim()) {
        setList([])
        setTotalElements(0)
        setTotalPages(0)
        setError(null)
        return
      }
      setLoading(true)
      setError(null)
      try {
        // Real endpoint: GET /admin/v1/search?category=user&keyword=...&page=&size=
        const res = await userApi.search({ keyword: kw.trim(), page: p, size: sz })
        const data = res.data
        setList(data.content ?? [])
        setTotalElements(data.totalElements ?? 0)
        setTotalPages(data.totalPages ?? 0)
      } catch (err) {
        setList([])
        setTotalElements(0)
        setTotalPages(0)
        setError((err as Error).message || '加载用户列表失败')
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const submitSearch = (e: FormEvent) => {
    e.preventDefault()
    setKeyword(searchInput.trim())
    setPage(0)
    setHasSearched(true)
    fetchSearch(searchInput.trim(), 0, size)
  }

  const resetFilters = () => {
    setSearchInput('')
    setKeyword('')
    setHasSearched(false)
    setPage(0)
    setList([])
    setTotalElements(0)
    setTotalPages(0)
    setError(null)
  }

  // Re-run when page/size changes after an initial search.
  useEffect(() => {
    if (hasSearched && keyword) {
      fetchSearch(keyword, page, size)
    }
  }, [keyword, page, size, hasSearched, fetchSearch])

  const summary = useMemo(
    () => ({ searched: hasSearched, keyword, shown: list.length, total: totalElements }),
    [hasSearched, keyword, list.length, totalElements]
  )

  const openDetail = useCallback(async (u: UserVO) => {
    setDetailUser(u)
    setDetailLoading(true)
    try {
      const fresh = await userApi.getById(u.id)
      setDetailUser(fresh)
    } catch {
      // keep list row data on failure
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const loadFollow = useCallback(
    async (tab: FollowTab) => {
      if (!detailUser) return
      setFollowTab(tab)
      setFollowLoading(true)
      try {
        const res =
          tab === 'followers'
            ? await userApi.getFollowers(detailUser.id, { page: 0, size: 20 })
            : await userApi.getFollowees(detailUser.id, { page: 0, size: 20 })
        setFollowData(res.content ?? [])
      } catch (err) {
        setFollowData([])
        toast('加载失败', { variant: 'error', description: (err as Error).message })
      } finally {
        setFollowLoading(false)
      }
    },
    [detailUser]
  )

  const pagerNumbers = useMemo(() => {
    const set = new Set<number>([0, totalPages - 1, page - 1, page, page + 1])
    return Array.from(set).filter((p) => p >= 0 && p < totalPages).sort((a, b) => a - b)
  }, [page, totalPages])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <span>用户中心</span>
            <span className="text-border">/</span>
            <span className="text-foreground">用户管理</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">用户管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            通过关键词搜索用户，查看资料与粉丝 / 关注关系。
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="md" onClick={() => hasSearched && fetchSearch(keyword, page, size)}>
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button variant="outline" size="md" onClick={resetFilters}>
            <FilterX className="h-4 w-4" />
            重置
          </Button>
        </div>
      </div>

      {/* Search card */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={submitSearch} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-9 space-y-1.5">
              <Label className="text-xs">搜索用户（必填）</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-10"
                  placeholder="输入用户名或账号搜索，例如 alice"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" variant="default" className="flex-1 h-10">
                <UserPlus className="h-4 w-4" />
                搜索
              </Button>
            </div>
          </form>
          <p className="text-[11px] text-muted-foreground mt-2">
            后端搜索接口要求提供非空关键词（GET /admin/v1/search?category=user）。
          </p>
        </CardContent>
      </Card>

      {/* Summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">搜索结果</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
            {loading ? <Loader2 className="h-5 w-5 animate-spin opacity-70 inline-block" /> : formatNumber(summary.total)}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">共 {formatNumber(summary.total)} 条结果</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">当前页展示</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatNumber(summary.shown)}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">下方列表可见</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">搜索关键词</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight truncate">{summary.keyword || '—'}</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">{summary.searched ? '已执行搜索' : '尚未搜索'}</div>
        </div>
      </div>

      {/* Result table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">搜索结果</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {summary.searched
                ? `显示第 ${formatNumber(page * size + 1)} - ${formatNumber(Math.min((page + 1) * size, totalElements))} 条，共 ${formatNumber(totalElements)} 条`
                : '请输入关键词开始搜索'}
            </CardDescription>
          </div>
          <div className="inline-flex items-center gap-1 rounded-xl border border-border bg-muted/30 p-0.5">
            <span className="px-2 text-xs text-muted-foreground">每页</span>
            {([10, 20, 50] as const).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSize(n)
                  setPage(0)
                }}
                className={cn(
                  'h-7 px-2 rounded-lg text-xs tabular-nums transition-all',
                  size === n
                    ? 'bg-background text-foreground shadow-sm border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {n} 条
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          <Table className="border-t border-border">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-[260px]">用户</TableHead>
                <TableHead className="w-[110px]">角色</TableHead>
                <TableHead className="w-[90px]">状态</TableHead>
                <TableHead className="w-[130px]">粉丝</TableHead>
                <TableHead className="w-[130px]">关注</TableHead>
                <TableHead className="w-[150px]">注册时间</TableHead>
                <TableHead className="text-right w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在搜索用户...
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="text-sm font-medium text-destructive">搜索失败</div>
                      <div className="text-xs text-muted-foreground mt-1">{error}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : !hasSearched ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center mb-3">
                        <Search className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">请输入关键词搜索用户</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        后端搜索接口需要非空关键词，请输入用户名或账号。
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="text-sm font-medium">未找到匹配用户</div>
                      <div className="text-xs text-muted-foreground mt-1">请尝试更换关键词。</div>
                      <Button variant="default" size="sm" className="mt-4" onClick={resetFilters}>
                        <FilterX className="h-3.5 w-3.5" /> 重置
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={u.avatar ?? undefined} alt={u.nickname} />
                          <AvatarFallback className="text-xs">{initialsOf(u.nickname, u.username)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate max-w-[200px]">
                            {u.nickname || u.username}
                          </div>
                          <div className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                            UID {u.id} · @{u.username}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'info' : 'secondary'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.status === 1 ? (
                        <Badge variant="success">正常</Badge>
                      ) : (
                        <Badge variant="destructive">已禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatNumber(u.followersCount ?? 0)}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatNumber(u.followeesCount ?? 0)}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openDetail(u)}>
                        查看详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {hasSearched && totalPages > 1 && !loading && (
            <>
              <Separator />
              <div className="p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page <= 0}
                      />
                    </PaginationItem>
                    {pagerNumbers.map((p, i, arr) => {
                      const nodes: ReactNode[] = []
                      if (i > 0 && p - arr[i - 1] > 1) {
                        nodes.push(
                          <PaginationItem key={`e-${p}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        )
                      }
                      nodes.push(
                        <PaginationItem key={p}>
                          <PaginationLink isActive={page === p} onClick={() => setPage(p)}>
                            {p + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                      return nodes
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>来自 GET /admin/v1/users/{'{id}'}。</DialogDescription>
          </DialogHeader>
          {!detailUser ? null : (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={detailUser.avatar ?? undefined} alt={detailUser.nickname} />
                  <AvatarFallback className="text-base">
                    {initialsOf(detailUser.nickname, detailUser.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-lg font-semibold tracking-tight truncate">
                      {detailUser.nickname || detailUser.username}
                    </div>
                    {detailUser.role === 'admin' && <Badge variant="info">管理员</Badge>}
                    {detailUser.status === 1 ? (
                      <Badge variant="success">正常</Badge>
                    ) : (
                      <Badge variant="destructive">已禁用</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    UID {detailUser.id} · @{detailUser.username}
                  </div>
                </div>
              </div>
              {detailLoading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> 正在同步最新信息...
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] text-muted-foreground">邮箱</div>
                  <div className="text-sm font-medium mt-0.5 truncate">{detailUser.email || '—'}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] text-muted-foreground">角色</div>
                  <div className="text-sm font-medium mt-0.5">{detailUser.role}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] text-muted-foreground">注册时间</div>
                  <div className="text-sm font-medium mt-0.5">{formatDate(detailUser.createdAt)}</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] text-muted-foreground">置顶帖文</div>
                  <div className="text-sm font-medium mt-0.5">{detailUser.pinnedPostId ?? '—'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-center flex-1">
                  <div className="text-lg font-semibold tabular-nums tracking-tight">
                    {formatNumber(detailUser.followersCount ?? 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">粉丝</div>
                </div>
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2 text-center flex-1">
                  <div className="text-lg font-semibold tabular-nums tracking-tight">
                    {formatNumber(detailUser.followeesCount ?? 0)}
                  </div>
                  <div className="text-[11px] text-muted-foreground">关注</div>
                </div>
              </div>

              {detailUser.bio && (
                <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                  <div className="text-[11px] font-medium text-muted-foreground">个人简介</div>
                  <div className="text-sm mt-0.5">{detailUser.bio}</div>
                </div>
              )}

              <Separator />

              {/* Followers / followees explorer */}
              <div className="inline-flex rounded-xl border border-border bg-muted/30 p-0.5 gap-0.5">
                {(['followers', 'followees'] as FollowTab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => loadFollow(t)}
                    className={cn(
                      'h-8 px-3 rounded-lg text-xs font-medium transition-all',
                      followTab === t
                        ? 'bg-background text-foreground shadow-sm border border-border'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {t === 'followers' ? '粉丝' : '关注'}
                  </button>
                ))}
              </div>
              {followLoading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-6">
                  <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
                </div>
              ) : followData.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-xs text-muted-foreground">
                  <Users className="h-5 w-5 opacity-60" />
                  暂无{followTab === 'followers' ? '粉丝' : '关注'}数据
                </div>
              ) : (
                <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                  {followData.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={f.avatar ?? undefined} alt={f.nickname} />
                        <AvatarFallback className="text-xs">{initialsOf(f.nickname, f.username)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{f.nickname || f.username}</div>
                        <div className="text-[11px] text-muted-foreground tabular-nums">@{f.username}</div>
                      </div>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {formatNumber(f.followersCount ?? 0)} 粉丝
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDetailUser(null)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}