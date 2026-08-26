import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Download,
  Eye,
  Loader2,
  RefreshCcw,
  Users,
  Video,
  Wallet,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { NativeSelect } from '@/components/ui/native-select'
import { toast } from '@/components/ui/toast'
import {
  statisticApi,
  type StatisticCounts,
  type StatisticSeriesItem,
} from '@/services/statistic'
import { cn, formatNumber } from '@/lib/utils'

type RangeKey = '7d' | '30d' | '90d'
const RANGE_OPTIONS: { value: RangeKey; label: string; days: number }[] = [
  { value: '7d', label: '最近 7 天', days: 7 },
  { value: '30d', label: '最近 30 天', days: 30 },
  { value: '90d', label: '最近 90 天', days: 90 },
]

function generateEmptySeries(days: number): StatisticSeriesItem[] {
  const arr: StatisticSeriesItem[] = []
  const today = new Date()
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const date = `${d.getMonth() + 1}/${d.getDate()}`
    arr.push({ date, users: 0, videos: 0, views: 0, revenue: 0 })
  }
  return arr
}

interface OverviewMetric {
  key: keyof StatisticCounts
  label: string
  icon: React.ElementType
  accent: string
  tone: string
}

const METRICS: OverviewMetric[] = [
  {
    key: 'userCount',
    label: '用户总数',
    icon: Users,
    accent: 'bg-[#2f74ff]/12 text-[#2f74ff]',
    tone: 'from-[#2f74ff]/20 via-transparent to-transparent',
  },
  {
    key: 'videoCount',
    label: '视频总数',
    icon: Video,
    accent: 'bg-[#8a2be2]/12 text-[#8a2be2]',
    tone: 'from-[#8a2be2]/20 via-transparent to-transparent',
  },
  {
    key: 'viewCount',
    label: '播放总量',
    icon: Eye,
    accent: 'bg-[#15a877]/12 text-[#15a877]',
    tone: 'from-[#15a877]/20 via-transparent to-transparent',
  },
  {
    key: 'revenue',
    label: '累计收益（元）',
    icon: Wallet,
    accent: 'bg-[#e27900]/12 text-[#e27900]',
    tone: 'from-[#e27900]/20 via-transparent to-transparent',
  },
]

type TrendMode = 'users' | 'videos' | 'views'

function pickCount(
  counts: StatisticCounts | undefined,
  key: keyof StatisticCounts,
  fallback?: number
): number {
  if (!counts) return fallback ?? 0
  const v = counts[key]
  if (typeof v === 'number') return v
  const altKeys: Record<string, string[]> = {
    userCount: ['totalUsers', 'users', 'user_total'],
    videoCount: ['totalVideos', 'videos', 'video_total'],
    viewCount: ['totalViews', 'views', 'view_total'],
    revenue: ['totalRevenue', 'revenue_total'],
  }
  for (const alt of altKeys[key] || []) {
    const av = (counts as any)[alt]
    if (typeof av === 'number') return av
  }
  return fallback ?? 0
}

export default function ReportsPage() {
  const [range, setRange] = useState<RangeKey>('7d')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<StatisticCounts | null>(null)
  const [series, setSeries] = useState<StatisticSeriesItem[]>([])
  const [trendMode, setTrendMode] = useState<TrendMode>('users')

  const conf = RANGE_OPTIONS.find((o) => o.value === range)!

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await statisticApi.getOverview(conf.days)
      const overviewData: any =
        res.overview || res.counts || res.total || (typeof res === 'object' ? res : {})
      setOverview(overviewData as StatisticCounts)
      const seriesData: any =
        res.trend ||
        res.series ||
        res.timeline ||
        (Array.isArray(res) ? res : undefined) ||
        []
      const mappedSeries = Array.isArray(seriesData) ? seriesData : []
      setSeries(mappedSeries as StatisticSeriesItem[])
    } catch (err: any) {
      const message = err?.message || '加载概览数据失败'
      toast('加载失败', {
        variant: 'error',
        description: message,
      })
      setOverview(null)
      setSeries([])
    } finally {
      setLoading(false)
    }
  }, [conf.days])

  useEffect(() => {
    refresh()
  }, [refresh])

  const totals = useMemo(() => {
    return {
      userCount: pickCount(overview ?? undefined, 'userCount', 0),
      videoCount: pickCount(overview ?? undefined, 'videoCount', 0),
      viewCount: pickCount(overview ?? undefined, 'viewCount', 0),
      revenue: pickCount(overview ?? undefined, 'revenue', 0),
    }
  }, [overview])

  const deltas = useMemo(() => ({
    userCount: pickCount(overview ?? undefined, 'userGrowth' as any, 0),
    videoCount: pickCount(overview ?? undefined, 'videoGrowth' as any, 0),
    viewCount: pickCount(overview ?? undefined, 'viewGrowth' as any, 0),
    revenue: pickCount(overview ?? undefined, 'revenueGrowth' as any, 0),
  }), [overview])

  const chartSeries = useMemo(() => {
    const keyMap: Record<TrendMode, keyof StatisticSeriesItem> = {
      users: 'users',
      videos: 'videos',
      views: 'views',
    }
    const k = keyMap[trendMode]
    const base = series.length > 0 ? series : generateEmptySeries(conf.days)
    return base.map((s) => ({
      date: s.date || s.label || s.name || '-',
      value: (s as any)[k] ?? s.userCount ?? 0,
    }))
  }, [series, trendMode, conf.days])

  const distData: { name: string; value: number }[] = []

  const recentActivities: { id: number; actor: string; action: string; target: string; time: string; tone: string }[] = []

  const chartFooterStats = useMemo(() => {
    if (series.length === 0) return []
    const sum = (key: keyof StatisticSeriesItem) =>
      series.reduce((acc, s) => acc + Number((s as any)[key] ?? 0), 0)
    const dailyUsers = Math.round(sum('users') / series.length)
    const dailyVideos = Math.round(sum('videos') / series.length)
    const dailyViews = Math.round(sum('views') / series.length)
    const out: { label: string; value: string; tone: string }[] = []
    out.push({ label: '日均新增用户', value: formatNumber(dailyUsers), tone: 'text-[#2f74ff]' })
    out.push({ label: '日均新增视频', value: formatNumber(dailyVideos), tone: 'text-[#15a877]' })
    out.push({ label: '日均播放次数', value: formatNumber(dailyViews), tone: 'text-[#e27900]' })
    return out
  }, [series])

  const DIST_COLORS = ['#262626', '#2f74ff', '#15a877', '#e27900', '#8a2be2', '#b4b4b4']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <span>仪表盘</span>
            <span className="text-border">/</span>
            <span className="text-foreground">数据报表</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">数据概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看平台整体运营表现、增长趋势和用户活跃度。
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5 h-9">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <NativeSelect
              value={range}
              onChange={(e) => setRange(e.target.value as RangeKey)}
              className="!h-7 !border-0 !bg-transparent !shadow-none !px-1 !py-0 focus:!ring-0"
              wrapperClassName="!w-auto"
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button
            variant="secondary"
            size="md"
            onClick={refresh}
            disabled={loading}
            aria-label="刷新数据"
          >
            <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button variant="default" size="md"><Download className="h-4 w-4" />导出 CSV</Button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {METRICS.map((m) => {
          const value = (totals as any)[m.key] ?? 0
          const delta = (deltas as any)[m.key] ?? 0
          const up = delta >= 0
          const Icon = m.icon
          return (
            <Card key={m.key} className="relative overflow-hidden">
              <div className={cn('pointer-events-none absolute inset-0 bg-gradient-to-br', m.tone)} />
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{m.label}</div>
                    {loading ? (
                      <div className="mt-3 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">加载中...</span>
                      </div>
                    ) : (
                      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">
                        {m.key === 'revenue'
                          ? `¥${formatNumber(value)}`
                          : formatNumber(value)}
                      </div>
                    )}
                  </div>
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', m.accent)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Badge variant={up ? 'success' : 'destructive'} className="gap-1 px-1.5">
                    {up ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(delta)}%
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    相比上一个周期
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Trend chart + distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-3 flex-wrap">
            <div>
              <CardTitle>增长趋势</CardTitle>
              <CardDescription className="mt-1">
                {conf.label}平台关键指标的变化趋势。
              </CardDescription>
            </div>
            <div className="inline-flex rounded-xl border border-border bg-muted/30 p-0.5 gap-0.5">
              {(['users', 'videos', 'views'] as TrendMode[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrendMode(t)}
                  className={cn(
                    'h-8 px-3 rounded-lg text-xs font-medium capitalize transition-all',
                    trendMode === t
                      ? 'bg-background text-foreground shadow-sm border border-border'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {t === 'users' ? '新增用户' : t === 'videos' ? '新增视频' : '播放次数'}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartSeries}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#262626" stopOpacity={0.16} />
                      <stop offset="95%" stopColor="#262626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: '#00000014' }}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    dy={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#737373' }}
                    tickFormatter={(v: any) => formatNumber(v as number)}
                    width={56}
                  />
                  <Tooltip
                    cursor={{ stroke: '#00000014', strokeDasharray: '4 4' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #00000014',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      padding: 10,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [
                      formatNumber(v as number),
                      trendMode === 'users' ? '新增用户' : trendMode === 'videos' ? '新增视频' : '播放次数',
                    ]}
                    labelStyle={{ fontWeight: 600 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#262626"
                    strokeWidth={2.2}
                    fill="url(#areaGrad)"
                    activeDot={{ r: 4, fill: '#262626', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
          <CardFooter className="pt-0">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 w-full">
              {chartFooterStats.length === 0 ? (
                <span className="text-xs text-muted-foreground">暂无周期数据</span>
              ) : (
                chartFooterStats.map((k) => (
                  <div key={k.label} className="flex items-center gap-2 text-xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-current align-middle" />
                    <span className="text-muted-foreground">{k.label}</span>
                    <Separator orientation="vertical" className="h-3 mx-1" />
                    <span className={cn('font-semibold tabular-nums', k.tone)}>{k.value}</span>
                  </div>
                ))
              )}
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>用户地区分布</CardTitle>
            <CardDescription>观众地域占比 Top</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {distData.length === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-xs text-muted-foreground">
                <div className="h-10 w-10 rounded-2xl bg-black/5 flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 opacity-60" />
                </div>
                暂无地区分布数据
              </div>
            ) : (
              <>
                <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#0000000a" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    width={80}
                    tick={{ fontSize: 11, fill: '#404040' }}
                  />
                  <Tooltip
                    cursor={{ fill: '#00000008' }}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid #00000014',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                      padding: 10,
                      fontSize: 12,
                    }}
                    formatter={(v: any) => [`${((v as number) * 100).toFixed(1)}%`, '占比']}
                  />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={14}>
                    {distData.map((_, i) => (
                      <Cell key={i} fill={DIST_COLORS[i % DIST_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <Separator />
            <ul className="space-y-2.5">
              {distData.map((r, i) => (
                <li key={r.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ background: DIST_COLORS[i % DIST_COLORS.length] }}
                    />
                    <span className="text-foreground/90">{r.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 rounded-full bg-black/5 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${r.value * 100}%`,
                          background: DIST_COLORS[i % DIST_COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                      {(r.value * 100).toFixed(0)}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: activity + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>最近动态</CardTitle>
              <CardDescription>平台最新事件与运营操作记录</CardDescription>
            </div>
            <Badge variant="outline">共 {recentActivities.length} 条</Badge>
          </CardHeader>
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-10 text-center text-xs text-muted-foreground">
                暂无最近动态数据
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {recentActivities.map((a) => {
                  const dot =
                    a.tone === 'success'
                      ? 'bg-[#15a877]'
                      : a.tone === 'info'
                      ? 'bg-[#2f74ff]'
                      : a.tone === 'warning'
                      ? 'bg-[#fea900]'
                      : a.tone === 'alert'
                      ? 'bg-[#e27900]'
                      : 'bg-[#e8463a]'
                  return (
                    <li
                      key={a.id}
                      className="flex items-start gap-3 px-4 py-3.5 hover:bg-black/[0.02] transition-colors"
                    >
                      <div className="mt-1.5">
                        <span className={cn('block h-2 w-2 rounded-full', dot)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">{a.actor}</span>{' '}
                          <span className="text-muted-foreground">{a.action}</span>{' '}
                          <span className="font-medium">{a.target}</span>
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{a.time}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 shrink-0">
                        查看
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
            <CardDescription>跳转到常用管理功能</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Link
              to="/users"
              className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-black/[0.03] transition-colors"
            >
              <div className="h-9 w-9 rounded-xl bg-[#2f74ff]/12 text-[#2f74ff] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">用户管理</div>
                <div className="text-xs text-muted-foreground">搜索、封禁或认证用户</div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-black/[0.03] transition-colors cursor-not-allowed opacity-70">
              <div className="h-9 w-9 rounded-xl bg-[#15a877]/12 text-[#15a877] flex items-center justify-center">
                <Video className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">内容审核</div>
                <div className="text-xs text-muted-foreground">处理待审作品</div>
                <Badge variant="outline" className="mt-1">即将上线</Badge>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-black/[0.03] transition-colors cursor-not-allowed opacity-70">
              <div className="h-9 w-9 rounded-xl bg-[#e27900]/12 text-[#e27900] flex items-center justify-center">
                <Wallet className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">提现结算</div>
                <div className="text-xs text-muted-foreground">处理创作者收益提现</div>
                <Badge variant="outline" className="mt-1">即将上线</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
