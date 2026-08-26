import { request } from '@/api/http'
import type { CommentVO, PageResult, PostVO } from '@/api/types'
import type { PageParams } from '@/api/modules/user'

export interface ListPostsParams extends PageParams {
  userId?: number
  content?: string
  /** Post status filter */
  status?: number
}

/** Admin content endpoints (AdminContentController). */
export const contentApi = {
  listPosts(params: ListPostsParams) {
    return request<PageResult<PostVO>>({
      url: '/admin/v1/posts',
      method: 'GET',
      params: {
        userId: params.userId,
        content: params.content || undefined,
        status: params.status,
        page: params.page ?? 0,
        size: params.size ?? 20,
      },
    })
  },

  deletePost(postId: number) {
    return request<void>({ url: `/admin/v1/posts/${postId}`, method: 'DELETE' })
  },

  getPostComments(postId: number, params: PageParams) {
    return request<PageResult<CommentVO>>({
      url: `/admin/v1/posts/${postId}/comments`,
      method: 'GET',
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    })
  },

  getCommentReplies(commentId: number, params: PageParams) {
    return request<PageResult<CommentVO>>({
      url: `/admin/v1/comments/${commentId}/replies`,
      method: 'GET',
      params: { page: params.page ?? 0, size: params.size ?? 20 },
    })
  },

  deleteComment(commentId: number) {
    return request<void>({ url: `/admin/v1/comments/${commentId}`, method: 'DELETE' })
  },
}