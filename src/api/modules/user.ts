import { request } from '@/api/http'
import type { PageResult, SearchResult, UserVO } from '@/api/types'

export interface PageParams {
  /** zero-based page index (Spring Pageable) */
  page?: number
  size?: number
}

export interface SearchUsersParams {
  keyword: string
  page?: number
  size?: number
}

/** Admin user endpoints (AdminSearchController + AdminUserController). */
export const userApi = {
  /** Search users by keyword -> SearchResult<UserVO> with a paged `data` block */
  search(params: SearchUsersParams) {
    return request<SearchResult<UserVO>>({
      url: '/admin/v1/search',
      method: 'GET',
      params: { category: 'user', keyword: params.keyword, page: params.page ?? 0, size: params.size ?? 20 },
    })
  },

  /** Current logged-in administrator profile */
  me() {
    return request<UserVO>({ url: '/admin/v1/users/me', method: 'GET' })
  },

  getById(userId: number) {
    return request<UserVO>({ url: `/admin/v1/users/${userId}`, method: 'GET' })
  },

  getFollowers(userId: number, params: PageParams) {
    return request<PageResult<UserVO>>({
      url: `/admin/v1/users/${userId}/followers`,
      method: 'GET',
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    })
  },

  getFollowees(userId: number, params: PageParams) {
    return request<PageResult<UserVO>>({
      url: `/admin/v1/users/${userId}/followees`,
      method: 'GET',
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    })
  },
}