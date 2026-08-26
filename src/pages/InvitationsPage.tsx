import { useState, type FormEvent } from 'react'
import { Copy, Link2, Loader2, Ticket } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toast'
import { invitationApi } from '@/api'
import type { InvitationVO } from '@/api/types'
import { formatDate } from '@/lib/utils'

function copy(code: string) {
  navigator.clipboard?.writeText(code).then(
    () => toast('已复制', { variant: 'success', description: `邀请码 ${code} 已复制到剪贴板` }),
    () => toast('复制失败', { variant: 'error' })
  )
}

export default function InvitationsPage() {
  const [count, setCount] = useState(1)
  const [days, setDays] = useState(7)
  const [scene, setScene] = useState('default')
  const [saving, setSaving] = useState(false)
  const [codes, setCodes] = useState<InvitationVO[]>([])

  const generate = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = await invitationApi.generate({
        count: Math.max(1, Math.min(100, count)),
        days: Math.max(1, Math.min(365, days)),
        scene: scene.trim() || 'default',
      })
      setCodes(Array.isArray(data) ? data : [])
      toast('生成成功', { variant: 'success', description: `已生成 ${data.length} 个邀请码` })
    } catch (err) {
      toast('生成失败', { variant: 'error', description: (err as Error).message })
    } finally {
      setSaving(false)
    }
  }

  const statusMeta = (status: number) =>
    status === 1
      ? { label: '未使用', variant: 'success' as const }
      : status === 2
        ? { label: '已使用', variant: 'secondary' as const }
        : { label: '已失效', variant: 'destructive' as const }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <span>运营中心</span>
            <span className="text-border">/</span>
            <span className="text-foreground">邀请码</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">邀请码</h1>
          <p className="text-sm text-muted-foreground mt-1">
            为平台用户生成邀请码，用于注册邀请。
          </p>
        </div>
      </div>

      {/* Generate form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-4 w-4" /> 生成邀请码
          </CardTitle>
          <CardDescription>POST /admin/v1/invitations</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={generate} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs" htmlFor="count">生成数量（1-100）</Label>
              <Input
                id="count"
                type="number"
                min={1}
                max={100}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-4 space-y-1.5">
              <Label className="text-xs" htmlFor="days">有效期（1-365 天）</Label>
              <Input
                id="days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs" htmlFor="scene">场景标识</Label>
              <Input
                id="scene"
                placeholder="default"
                value={scene}
                onChange={(e) => setScene(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" variant="default" className="w-full h-10" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                生成
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Generated list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">本次生成的邀请码</CardTitle>
          <CardDescription className="mt-0.5 text-xs">
            共 {codes.length} 个
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 pt-0">
          {codes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-xs text-muted-foreground">
              <div className="h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center mb-1">
                <Link2 className="h-5 w-5 opacity-60" />
              </div>
              暂无生成的邀请码，请填写参数后点击「生成」。
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden mx-4 mb-4">
              {codes.map((c) => {
                const meta = statusMeta(c.status)
                return (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-3.5 flex-wrap">
                    <Badge variant="outline" className="font-mono text-sm tabular-nums">
                      {c.code}
                    </Badge>
                    <div className="flex-1 min-w-0 text-[11px] text-muted-foreground">
                      <div>场景：{c.scene}</div>
                      {c.expiredAt && <div>到期：{formatDate(c.expiredAt)}</div>}
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => copy(c.code)}>
                      <Copy className="h-3.5 w-3.5" /> 复制
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />
    </div>
  )
}