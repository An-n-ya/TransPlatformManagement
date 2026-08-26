import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Hash,
  FileText,
  Heart,
  MessageCircle,
  Bookmark,
  Loader2,
  RefreshCcw,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/toast'
import { topicApi, contentApi, userApi } from '@/api'
import type { PostVO, TopicVO, UserVO } from '@/api/types'
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

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-0.5 truncate">{value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<UserVO | null>(null)
  const [topics, setTopics] = useState<TopicVO[]>([])
  const [posts, setPosts] = useState<PostVO[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [me, hot, recent] = await Promise.all([
        userApi.me(),
        topicApi.getHotTopics(10),
        contentApi.listPosts({ page: 0, size: 8 }),
      ])
      setProfile(me)
      setTopics(hot)
      setPosts(recent.content ?? [])
    } catch (err) {
      toast('加载失败', { variant: 'error', description: (err as Error)?.message })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Real aggregates derived from the fetched records (no invented numbers).
  const derived = useMemo(() => {
    const likes = posts.reduce((acc, p) => acc + (p.likesCount || 0), 0)
    const comments = posts.reduce((acc, p) => acc + (p.commentsCount || 0), 0)
    const collections = posts.reduce((acc, p) => acc + (p.collectionsCount || 0), 0)
    return { likes, comments, collections }
  }, [posts])

  const statCards = useMemo(
    () => [
      { label: '热门话题', value: topics.length, icon: Hash, tone: 'text-[#2f74ff]', bg: 'bg-[#2f74ff]/12' },
      { label: '最近点赞', value: derived.likes, icon: Heart, tone: 'text-[#e8463a]', bg: 'bg-[#e8463a]/12' },
      { label: '最近评论', value: derived.comments, icon: MessageCircle, tone: 'text-[#15a877]', bg: 'bg-[#15a877]/12' },
      { label: '最近收藏', value: derived.collections, icon: Bookmark, tone: 'text-[#e27900]', bg: 'bg-[#e27900]/12' },
    ],
    [topics.length, derived]
  )

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
            <span>仪表盘</span>
            <span className="text-border">/</span>
            <span className="text-foreground">数据概览</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">数据概览</h1>
          <p className="text-sm text-muted-foreground mt-1">
            基于管理后台真实接口汇总的运营数据。
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={refresh} disabled={loading}>
          <RefreshCcw className={cn('h-4 w-4', loading && 'animate-spin')} />
          刷新
        </Button>
      </div>

      {/* Real KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label}>
              <CardContent className="p-5 relative">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    {loading ? (
                      <div className="mt-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className={cn('mt-2 text-2xl font-semibold tracking-tight tabular-nums', s.tone)}>
                        {formatNumber(s.value)}
                      </div>
                    )}
                  </div>
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', s.bg, s.tone)}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Profile + hot topics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" /> 当前管理员
            </CardTitle>
            <CardDescription>来自 GET /admin/v1/users/me</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile.avatar ?? undefined} alt={profile.nickname} />
                    <AvatarFallback>{initialsOf(profile.nickname, profile.username)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold truncate">{profile.nickname}</span>
                      <Badge variant="info">@{profile.username}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {profile.role === 'admin' ? '系统管理员' : profile.role}
                      {profile.email ? ` · ${profile.email}` : ''}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ProfileField label="账号状态" value={profile.status === 1 ? '正常' : '已禁用'} />
                  <ProfileField label="粉丝数" value={formatNumber(profile.followersCount ?? 0)} />
                  <ProfileField label="关注数" value={formatNumber(profile.followeesCount ?? 0)} />
                  <ProfileField label="注册时间" value={formatDate(profile.createdAt)} />
                </div>
                {profile.bio && (
                  <div className="rounded-xl border border-border bg-muted/20 px-3 py-2.5">
                    <div className="text-[11px] text-muted-foreground">个人简介</div>
                    <div className="text-sm mt-0.5">{profile.bio}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                加载中...
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Hash className="h-4 w-4" /> 热门话题
              </CardTitle>
              <CardDescription>来自 GET /admin/v1/topics/hot</CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/topics">
                管理话题 <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-10">
                <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
              </div>
            ) : topics.length === 0 ? (
              <div className="py-10 text-center text-xs text-muted-foreground">暂无话题数据</div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {topics.map((t, i) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">#{t.name}</div>
                      {t.description && (
                        <div className="text-[11px] text-muted-foreground truncate">{t.description}</div>
                      )}
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {formatNumber(t.postCount ?? 0)} 帖
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" /> 最近帖文
            </CardTitle>
            <CardDescription>来自 GET /admin/v1/posts</CardDescription>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/posts">
              全部帖文 <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-12">
              <Loader2 className="h-4 w-4 animate-spin" /> 加载中...
            </div>
          ) : posts.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">暂无帖文数据</div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {posts.map((p) => (
                <li key={p.id} className="flex items-start gap-3 px-4 py-3.5">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={p.author.avatar ?? undefined} alt={p.author.nickname} />
                    <AvatarFallback className="text-xs">
                      {initialsOf(p.author.nickname, p.author.username)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm flex-wrap">
                      <span className="font-medium">{p.author.nickname || p.author.username}</span>
                      <span className="text-muted-foreground">#{p.id}</span>
                      <span className="text-[11px] text-muted-foreground">{formatDate(p.createdAt)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2 break-words">{p.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {formatNumber(p.likesCount)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" /> {formatNumber(p.commentsCount)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Bookmark className="h-3 w-3" /> {formatNumber(p.collectionsCount)}
                      </span>
                      {p.images.length > 0 && (
                        <span className="tabular-nums">{p.images.length} 张图</span>
                      )}
                      {p.topics.map((t) => (
                        <Badge key={t.id} variant="outline" className="text-[10px]">#{t.name}</Badge>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Separator />
    </div>
  )
}