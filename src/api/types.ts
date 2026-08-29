/**
 * Domain types mirroring the real backend data models.
 * Source: TransPlatformServer/src/main/java/com/app/{common,user,content,topic,interaction,invitation}
 */

/** Unified backend envelope: BusinessResponse<T> -> success code=200 */
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

/** Paged result: PageResult<T> (Spring Data page mapped to a VO) */
export interface PageResult<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

/** Search wrapper: SearchResult<T> hosts a paged `data` block */
export interface SearchResult<T> {
  category: string
  keyword: string
  data: PageResult<T>
}

/** UserViewObject public profile (no password) */
export interface UserVO {
  id: number
  username: string
  nickname: string
  avatar: string | null
  bio: string | null
  bioHeaderImg: string | null
  email: string | null
  pinnedPostId: number | null
  role: string
  /** 1 = active, else disabled */
  status: number
  followersCount: number | null
  followeesCount: number | null
  createdAt: string
}

/** AuthResponse returned by /admin/v1/auth/login and /refresh */
export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
  /** token lifetime in seconds */
  expiresIn: number
  user: UserVO
}

export interface LoginRequest {
  username: string
  password: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

/** TopicVO for admin topic CRUD */
export interface TopicVO {
  id: number
  name: string
  description: string | null
  postCount: number | null
  createdAt: string
}

export interface TopicRequest {
  name: string
  description?: string
}

/** CommentVO for admin comment listing */
export interface CommentVO {
  id: number
  postId: number
  author: UserVO
  parentId: number | null
  replyToUser: UserVO | null
  content: string
  likesCount: number
  liked: boolean
  commentsCount: number | null
  topReply: {
    id: number
    userId: number
    nickname: string
    content: string
    likesCount: number
  } | null
  replies: CommentVO[] | null
  createdAt: string
}

/** PostVO for admin post listing */
export interface PostVO {
  id: number
  author: UserVO
  content: string
  images: string[]
  location: string | null
  likesCount: number
  commentsCount: number
  collectionsCount: number
  topics: TopicVO[]
  liked: boolean
  collected: boolean
  createdAt: string
}

/** InvitationVO for generated invite codes */
export interface InvitationVO {
  id: number
  code: string
  inviterId: number | null
  inviteeId: number | null
  status: number
  expiredAt: string | null
  scene: string
  createdAt: string
}

export interface GenerateInvitationRequest {
  count?: number
  days?: number
  scene?: string
}

export interface SendInvitationEmailRequest {
  email: string
  days?: number
  scene?: string
}