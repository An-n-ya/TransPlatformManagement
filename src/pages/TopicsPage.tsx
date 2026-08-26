import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Hash, Loader2, MoreHorizontal, Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
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
import { topicApi } from '@/api'
import type { TopicVO } from '@/api/types'
import { cn, formatDate, formatNumber } from '@/lib/utils'

type EditorState = {
  open: boolean
  mode: 'create' | 'edit'
  topic: TopicVO | null
  name: string
  description: string
  saving: boolean
}

const CLOSED_EDITOR: EditorState = {
  open: false,
  mode: 'create',
  topic: null,
  name: '',
  description: '',
  saving: false,
}

export default function TopicsPage() {
  const [page, setPage] = useState(0)
  const [size] = useState<10 | 20 | 50>(20)
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState<TopicVO[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [editor, setEditor] = useState<EditorState>(CLOSED_EDITOR)
  const [deleteTarget, setDeleteTarget] = useState<TopicVO | null>(null)

  const fetchTopics = useCallback(async (p: number, s: number) => {
    setLoading(true)
    try {
      const res = await topicApi.listTopics({ page: p, size: s })
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
    fetchTopics(0, size)
  }, [size, fetchTopics])

  const openCreate = () =>
    setEditor({ open: true, mode: 'create', topic: null, name: '', description: '', saving: false })

  const openEdit = (t: TopicVO) =>
    setEditor({ open: true, mode: 'edit', topic: t, name: t.name, description: t.description || '', saving: false })

  const save = async () => {
    if (!editor.name.trim()) {
      toast('校验失败', { variant: 'warning', description: '话题名称不能为空' })
      return
    }
    setEditor((e) => ({ ...e, saving: true }))
    try {
      if (editor.mode === 'create') {
        await topicApi.create({ name: editor.name.trim(), description: editor.description.trim() || undefined })
        toast('创建成功', { variant: 'success' })
      } else if (editor.topic) {
        await topicApi.update(editor.topic.id, {
          name: editor.name.trim(),
          description: editor.description.trim() || undefined,
        })
        toast('更新成功', { variant: 'success' })
      }
      setEditor(CLOSED_EDITOR)
      fetchTopics(page, size)
    } catch (err) {
      toast('保存失败', { variant: 'error', description: (err as Error).message })
    } finally {
      setEditor((e) => ({ ...e, saving: false }))
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    try {
      await topicApi.remove(deleteTarget.id)
      toast('删除成功', { variant: 'success', description: `话题「${deleteTarget.name}」已删除` })
      setList((l) => l.filter((t) => t.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (err) {
      toast('删除失败', { variant: 'error', description: (err as Error).message })
    }
  }

  const pagerNumbers = Array.from(new Set([0, totalPages - 1, page - 1, page, page + 1]))
    .filter((p) => p >= 0 && p < totalPages)
    .sort((a, b) => a - b)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <span>内容中心</span>
            <span className="text-border">/</span>
            <span className="text-foreground">话题管理</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">话题管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            创建、编辑与删除平台话题，删除为逻辑删除。
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="md" onClick={() => fetchTopics(page, size)}>
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button variant="default" size="md" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            新建话题
          </Button>
        </div>
      </div>

      {/* Topic table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-3 flex-wrap gap-3">
          <div>
            <CardTitle className="text-base">话题列表</CardTitle>
            <CardDescription className="mt-0.5 text-xs">
              {loading
                ? '正在加载话题...'
                : `显示第 ${formatNumber(page * size + 1)} - ${formatNumber(Math.min((page + 1) * size, totalElements))} 条，共 ${formatNumber(totalElements)} 条`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          <Table className="border-t border-border">
            <TableHeader>
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                <TableHead className="w-[220px]">话题</TableHead>
                <TableHead>描述</TableHead>
                <TableHead className="w-[110px]">帖文数</TableHead>
                <TableHead className="w-[140px]">创建时间</TableHead>
                <TableHead className="text-right w-[90px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> 正在加载话题...
                    </div>
                  </TableCell>
                </TableRow>
              ) : list.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="mx-auto max-w-sm">
                      <div className="mx-auto h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center mb-3">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="text-sm font-medium">暂无话题数据</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        点击右上角「新建话题」创建第一个话题。
                      </div>
                      <Button variant="default" size="sm" className="mt-4" onClick={openCreate}>
                        <Plus className="h-3.5 w-3.5" /> 新建话题
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                list.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[#2f74ff]">#{t.name}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.description || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="tabular-nums">
                        {formatNumber(t.postCount ?? 0)} 帖
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatDate(t.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="打开操作菜单" className="text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(t)}>
                            <Pencil className="h-4 w-4" /> 编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteTarget(t)} className="!text-destructive focus:!text-destructive focus:!bg-destructive/10">
                            <Trash2 className="h-4 w-4" /> 删除
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

      {/* Create / edit dialog */}
      <Dialog
        open={editor.open}
        onOpenChange={(o) => !o && setEditor(CLOSED_EDITOR)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editor.mode === 'create' ? '新建话题' : '编辑话题'}</DialogTitle>
            <DialogDescription>名称必填（最长 50 字符），描述可选（最长 200 字符）。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="topic-name">话题名称</Label>
              <Input
                id="topic-name"
                placeholder="例如：旅行"
                value={editor.name}
                maxLength={50}
                onChange={(e) => setEditor((s) => ({ ...s, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs" htmlFor="topic-desc">话题描述</Label>
              <textarea
                id="topic-desc"
                rows={3}
                maxLength={200}
                placeholder="描述这个话题的用途（可选）"
                value={editor.description}
                onChange={(e) => setEditor((s) => ({ ...s, description: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-[#000] focus:border-[#000] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={() => setEditor(CLOSED_EDITOR)} disabled={editor.saving}>
              取消
            </Button>
            <Button variant="default" onClick={save} disabled={editor.saving}>
              {editor.saving && <Loader2 className="h-4 w-4 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该话题？</AlertDialogTitle>
            <AlertDialogDescription>
              即将逻辑删除话题「{deleteTarget?.name ?? ''}」，删除后用户侧将不再可见。
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