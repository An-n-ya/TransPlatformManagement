import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import {
  Bookmark,
  FileText,
  FilterX,
  Heart,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  RefreshCcw,
  Search,
  Trash2,
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { toast } from '@/components/ui/toast'
import { contentApi } from '@/api'
import type { CommentVO, PostVO } from '@/api/types'
import { cn, formatDate, formatNumber } from '@/lib/utils'

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

export default function PostsPage() {
  const [content, setContent] = useState('')
  const [page, setPage] = useState(0)
  const [size, setSize] = useState<10 | 20 | 50>(20)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<PostVO[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [commentsPost, setCommentsPost] = useState<PostVO | null>(null)
  const [comments, setComments] = useState<CommentVO[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PostVO | null>(null)

  const fetchPosts = useCallback(async (c: string, p: number, s: number) => {
    setLoading(true)
    try {
      const res = await contentApi.listPosts({ content: c || undefined, page: p, size: s })
      setList(res.content ?? [])
      setTotalElements(res.totalElements ?? 0)
      setTotalPages(res.totalPages ?? 0)
    } catch (err) {
      setList([])
      setTotalElements(0)
      setTotalPages(0)
      toast('加载失败', { variant: 'error', description: (err as Error).message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPosts('', 0, size)
  }, [size, fetchPosts])

  const submitFilter = (e: FormEvent) => {
    e.preventDefault()
    setPage(0)
    fetchPosts(content.trim(), 0, size)
  }

  const resetFilters = () => {
    setContent('')
    setPage(0)
    fetchPosts('', 0, size)
  }

  const openComments = useCallback(async (post: PostVO) => {
    setCommentsPost(post)
    setCommentsLoading(true)
    setComments([])
    try {
      const res = await contentApi.getPostComments(post.id, { page: 0, size: 20 })
      setComments(res.content ?? [])
    } catch (err) {
      setComments([])
      toast('加载评论失败', { variant: 'error', description: (err as Error).message })
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await contentApi.deletePost(deleteTarget.id)
      toast('删除成功', { variant: 'success', description: `帖文 #${deleteTarget.id} 已逻辑删除` })
      setList((l) => l.filter((p) => p.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      toast('删除失败', { variant: 'error', description: (err as Error).message })
    }
  }, [deleteTarget])

  const deleteComment = useCallback(async (commentId: number) => {
    try {
      await contentApi.deleteComment(commentId)
      setComments((cs) => cs.filter((c) => c.id !== commentId))
      toast('评论已删除', { variant: 'success' })
    } catch (err) {
      toast('删除失败', { variant: 'error', description: (err as Error).message })
    }
  }, [])

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
            <span>内容中心</span>
            <span className="text-border">/</span>
            <span className="text-foreground">帖文管理</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">帖文管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查询平台帖文、查看评论，并可逻辑删除违规内容。
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={() => fetchPosts(content.trim(), page, size)}>
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* Filter card */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={submitFilter} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-9 space-y-1.5">
              <Label className="text-xs">按内容筛选</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-10"
                  placeholder="输入帖文内容关键词（可选）"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>
            <div className="md:col-span-3 flex gap-2">
              <Button type="submit" variant="default" className="flex-1 h-10">
                <Search className="h-4 w-4" />
                筛选
              </Button>
              <Button type="button" variant="secondary" onClick={resetFilters} className="h-10">
                <FilterX className="h-4 w-4" />
                重置
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Post table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">帖文列表</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {loading
                ? '正在加载帖文...'
                : `显示第 ${formatNumber(page * size + 1)} - ${formatNumber(Math.min((page + 1) * size, totalElements))} 条，共 ${formatNumber(totalElements)} 条`}
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
                <TableHead className="w-[180px]">作者</TableHead>
                <TableHead>内容</TableHead>
                <TableHead className="w-[120px]">互动数据</TableHead>
                <TableHead className="w-[130px]">创建时间</TableHead>
                <TableHead className="text-right w-[90px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> 正在加载帖文...
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center mb-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">暂无帖文数据</div>
                      <div className="text-xs text-muted-foreground mt-1">请调整筛选条件后重试。</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={p.author.avatar ?? undefined} alt={p.author.nickname} />
                          <AvatarFallback className="text-xs">{initialsOf(p.author.nickname, p.author.username)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate max-w-[130px]">
                            {p.author.nickname || p.author.username}
                          </div>
                          <div className="text-[11px] text-muted-foreground tabular-nums">#{p.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm line-clamp-2 break-words max-w-[420px] text-foreground/90">{p.content}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {p.images.length > 0 && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <ImageIcon className="h-3 w-3" /> {p.images.length}
                          </Badge>
                        )}
                        {p.topics.map((t) => (
                          <Badge key={t.id} variant="outline" className="text-[10px]">#{t.name}</Badge>
                        ))}
                        {p.location && <span className="text-[11px] text-muted-foreground">📍 {p.location}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1" title="点赞">
                          <Heart className="h-3 w-3" /> {formatNumber(p.likesCount)}
                        </span>
                        <span className="inline-flex items-center gap-1" title="评论">
                          <MessageCircle className="h-3 w-3" /> {formatNumber(p.commentsCount)}
                        </span>
                        <span className="inline-flex items-center gap-1" title="收藏">
                          <Bookmark className="h-3 w-3" /> {formatNumber(p.collectionsCount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatDate(p.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="打开操作菜单" className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openComments(p)}>
                            <MessageCircle className="h-4 w-4" />
                            查看评论
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="!text-destructive focus:!text-destructive focus:!bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                            删除帖文
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && !loading && (
            <>
              <Separator />
              <div className="p-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                      onClick={() => {
                        const np = Math.max(0, page - 1)
                        setPage(np)
                        fetchPosts(content.trim(), np, size)
                      }}
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
                          <PaginationLink isActive={page === p} onClick={() => { setPage(p); fetchPosts(content.trim(), p, size) }}>
                            {p + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                      return nodes
                    })}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          const np = Math.min(totalPages - 1, page + 1)
                          setPage(np)
                          fetchPosts(content.trim(), np, size)
                        }}
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

      {/* Comments dialog */}
      <Dialog open={!!commentsPost} onOpenChange={(o) => !o && setCommentsPost(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>帖子评论</DialogTitle>
            <DialogDescription>
              {commentsPost ? `帖文 #${commentsPost.id} 的评论列表` : ''}
            </DialogDescription>
          </DialogHeader>
          {commentsLoading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-10">
              <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-10">暂无评论</div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden max-h-[50vh] overflow-y-auto">
              {comments.map((c) => (
                <li key={c.id} className="flex items-start gap-3 px-4 py-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={c.author.avatar ?? undefined} alt={c.author.nickname} />
                    <AvatarFallback className="text-xs">{initialsOf(c.author.nickname, c.author.username)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium">{c.author.nickname || c.author.username}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(c.createdAt)}</span>
                      <Badge variant="secondary" className="ml-auto">{formatNumber(c.likesCount)} 赞</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 break-words">{c.content}</p>
                    {c.replies && c.replies.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {c.replies.map((r) => (
                          <div key={r.id} className="rounded-lg bg-muted/40 px-3 py-2">
                            <div className="text-[11px] text-muted-foreground">{r.author.nickname || r.author.username}</div>
                            <p className="text-xs mt-0.5">{r.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" size="icon-sm" className="shrink-0 text-muted-foreground" onClick={() => deleteComment(c.id)} aria-label="删除评论">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCommentsPost(null)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该帖文？</AlertDialogTitle>
            <AlertDialogDescription>
              即将逻辑删除帖文「{deleteTarget ? `#${deleteTarget.id}` : ''}」。
              删除后用户侧将不再可见，且无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="!bg-[#e8463a] hover:!bg-[#cf3d33] !text-white">
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}