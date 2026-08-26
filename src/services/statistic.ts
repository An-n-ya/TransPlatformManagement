import { request } from '@/api/http'

/**
 * Aggregated platform counters returned by the statistics endpoint.
 * Growth fields are optional — not every backend snapshot includes them.
 */
export interface StatisticCounts {
  userCount: number
  videoCount: number
  viewCount: number
  revenue: number
  userGrowth?: number
  videoGrowth?: number
  viewGrowth?: number
  revenueGrowth?: number
}

/** One point of a daily trend series. */
export interface StatisticSeriesItem {
  date: string
  users: number
  videos: number
  views: number
  revenue: number
  label?: string
  name?: string
  userCount?: number
}

/**
 * Loose container so the page tolerates whichever shape the backend returns
 * (ReportsPage falls back across `overview` / `counts` / `total` / raw body).
 */
export interface StatisticOverviewResponse {
  overview?: StatisticCounts
  counts?: StatisticCounts
  total?: StatisticCounts
  trend?: StatisticSeriesItem[]
  series?: StatisticSeriesItem[]
  timeline?: StatisticSeriesItem[]
}

export const statisticApi = {
  /**
   * Fetch overview counters + trend series for the last `days`.
   * NOTE: endpoint path is inferred from the other `/admin/v1/*` modules —
   * adjust to the real controller route if the backend differs.
   */
  async getOverview(days: number): Promise<StatisticOverviewResponse> {
    return request<StatisticOverviewResponse>({
      url: '/admin/v1/statistics/overview',
      method: 'GET',
      params: { days },
    })
  },
}
