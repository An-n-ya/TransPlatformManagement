import { request } from '@/api/http'
import type { PageResult, TopicRequest, TopicVO } from '@/api/types'
import type { PageParams } from '@/api/modules/user'

/** Admin topic endpoints (AdminTopicController) - full CRUD. */
export const topicApi = {
  listTopics(params: PageParams) {
    return request<PageResult<TopicVO>>({
      url: '/admin/v1/topics',
      method: 'GET',
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    })
  },

  getHotTopics(limit = 10) {
    return request<TopicVO[]>({
      url: '/admin/v1/topics/hot',
      method: 'GET',
      params: { limit },
    })
  },

  getById(topicId: number) {
    return request<TopicVO>({ url: `/admin/v1/topics/${topicId}`, method: 'GET' })
  },

  create(data: TopicRequest) {
    return request<TopicVO>({ url: '/admin/v1/topics', method: 'POST', data })
  },

  update(topicId: number, data: TopicRequest) {
    return request<TopicVO>({ url: `/admin/v1/topics/${topicId}`, method: 'PUT', data })
  },

  remove(topicId: number) {
    return request<void>({ url: `/admin/v1/topics/${topicId}`, method: 'DELETE' })
  },
}